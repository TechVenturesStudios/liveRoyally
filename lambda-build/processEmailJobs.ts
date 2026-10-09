import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import type { SQSBatchResponse, SQSEvent, SQSRecord } from "aws-lambda";
import { Client } from "pg";

const MAX_ATTEMPTS = Number(process.env.EMAIL_MAX_ATTEMPTS || 5);
const region = process.env.AWS_REGION || "us-east-2";
const ses = new SESv2Client({ region });

function databaseClient() {
  return new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 5432),
    ssl: { rejectUnauthorized: false },
  });
}

type EmailJob = {
  job_id: string;
  to_email: string;
  subject: string;
  text_body: string;
  html_body: string;
  attempt_count: number;
};

function assertSafeHeaderValue(value: string, name: string) {
  if (/[\r\n]/.test(value)) {
    throw new Error(`${name} contains an invalid line break`);
  }
}

function encodeMimeHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function encodeMimeBody(value: string) {
  const encoded = Buffer.from(value, "utf8").toString("base64");
  return encoded.match(/.{1,76}/g)?.join("\r\n") || "";
}

function buildRawEmail(job: EmailJob, from: string, fromName: string) {
  assertSafeHeaderValue(from, "SES_FROM_EMAIL");
  assertSafeHeaderValue(fromName, "SES_FROM_NAME");
  assertSafeHeaderValue(job.to_email, "recipient email");
  assertSafeHeaderValue(job.subject, "email subject");

  const boundary = `=_LocalMetrics_${job.job_id.replace(/[^A-Za-z0-9]/g, "")}`;
  const displayFrom = fromName
    ? `${encodeMimeHeader(fromName)} <${from}>`
    : from;

  return [
    `From: ${displayFrom}`,
    `To: ${job.to_email}`,
    `Subject: ${encodeMimeHeader(job.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    encodeMimeBody(job.text_body),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    encodeMimeBody(job.html_body),
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

async function claimJob(client: Client, jobId: string) {
  await client.query("BEGIN");
  try {
    const result = await client.query<EmailJob>(`
    UPDATE email_jobs
    SET status = 'processing', processing_started_at = NOW(),
        attempt_count = attempt_count + 1, updated_at = NOW()
    WHERE job_id = $1
      AND ((status = 'queued' AND scheduled_at <= NOW())
        OR (status = 'processing' AND processing_started_at < NOW() - INTERVAL '10 minutes'))
    RETURNING job_id, to_email, subject, text_body, html_body, attempt_count
  `, [jobId]);
    await client.query("COMMIT");
    return result.rows[0] || null;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

async function getJobState(client: Client, jobId: string) {
  const result = await client.query<{ status: string; scheduled_at: Date }>(`
    SELECT status, scheduled_at
    FROM email_jobs
    WHERE job_id = $1
  `, [jobId]);
  return result.rows[0] || null;
}

function getJobId(record: SQSRecord) {
  const body = JSON.parse(record.body) as { jobId?: unknown };
  const jobId = String(body.jobId || "").trim();
  if (!jobId) throw new Error("SQS email job message is missing jobId");
  return jobId;
}

async function processRecord(record: SQSRecord, from: string, fromName: string) {
  const client = databaseClient();
  await client.connect();
  try {
    const jobId = getJobId(record);
    const job = await claimJob(client, jobId);

    if (!job) {
      const state = await getJobState(client, jobId);
      if (!state || state.status === "sent" || state.status === "failed" || state.status === "processing") {
        return null;
      }
      throw new Error(`Email job ${jobId} is not ready for processing`);
    }

    try {
      const response = await ses.send(new SendEmailCommand({
        Content: {
          Raw: {
            Data: Buffer.from(buildRawEmail(job, from, fromName), "utf8"),
          },
        },
      }));
      await client.query(`
        UPDATE email_jobs
        SET status = 'sent', sent_at = NOW(), provider_message_id = $2,
            last_error = NULL, updated_at = NOW()
        WHERE job_id = $1
      `, [job.job_id, response.MessageId || null]);
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const terminal = job.attempt_count >= MAX_ATTEMPTS;
      await client.query(`
        UPDATE email_jobs
        SET status = $2, last_error = $3,
            scheduled_at = CASE WHEN $4 THEN scheduled_at ELSE NOW() + INTERVAL '5 minutes' END,
            updated_at = NOW()
        WHERE job_id = $1
      `, [job.job_id, terminal ? "failed" : "queued", message.slice(0, 4000), terminal]);

      // A terminal failure is recorded in the database; delete the SQS message.
      // Retryable failures stay visible to SQS for another delivery attempt.
      return terminal ? null : record.messageId;
    }
  } finally {
    await client.end();
  }
}

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const from = String(process.env.SES_FROM_EMAIL || "").trim();
  if (!from) throw new Error("SES_FROM_EMAIL is required");
  const fromName = String(process.env.SES_FROM_NAME || "Local Metrics").trim();

  const failures: string[] = [];
  const concurrency = Math.max(1, Math.min(
    Number(process.env.EMAIL_CONCURRENCY || 5),
    event.Records.length || 1,
  ));
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < event.Records.length) {
      const record = event.Records[nextIndex++];
      try {
        const failedMessageId = await processRecord(record, from, fromName);
        if (failedMessageId) failures.push(failedMessageId);
      } catch (error) {
        console.error("email job processing error:", error);
        failures.push(record.messageId);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return { batchItemFailures: failures.map((itemIdentifier) => ({ itemIdentifier })) };
};
