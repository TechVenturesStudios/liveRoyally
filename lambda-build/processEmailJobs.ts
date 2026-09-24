import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
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

async function claimJobs(client: Client) {
  await client.query("BEGIN");
  const result = await client.query(`
    UPDATE email_jobs
    SET status = 'processing', processing_started_at = NOW(),
        attempt_count = attempt_count + 1, updated_at = NOW()
    WHERE job_id IN (
      SELECT job_id FROM email_jobs
      WHERE (status = 'queued' AND scheduled_at <= NOW())
         OR (status = 'processing' AND processing_started_at < NOW() - INTERVAL '10 minutes')
      ORDER BY priority DESC, scheduled_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT $1
    )
    RETURNING job_id, to_email, subject, text_body, html_body, attempt_count
  `, [Number(process.env.EMAIL_BATCH_SIZE || 10)]);
  await client.query("COMMIT");
  return result.rows;
}

export const handler = async () => {
  const client = databaseClient();
  await client.connect();
  try {
    const jobs = await claimJobs(client);
    const from = String(process.env.SES_FROM_EMAIL || "").trim();
    if (!from) throw new Error("SES_FROM_EMAIL is required");

    for (const job of jobs) {
      try {
        const response = await ses.send(new SendEmailCommand({
          FromEmailAddress: from,
          Destination: { ToAddresses: [job.to_email] },
          Content: {
            Simple: {
              Subject: { Data: job.subject, Charset: "UTF-8" },
              Body: {
                Text: { Data: job.text_body, Charset: "UTF-8" },
                Html: { Data: job.html_body, Charset: "UTF-8" },
              },
            },
          },
        }));
        await client.query(`
          UPDATE email_jobs
          SET status = 'sent', sent_at = NOW(), provider_message_id = $2,
              last_error = NULL, updated_at = NOW()
          WHERE job_id = $1
        `, [job.job_id, response.MessageId || null]);
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
      }
    }
    return { processed: jobs.length };
  } finally {
    await client.end();
  }
};
