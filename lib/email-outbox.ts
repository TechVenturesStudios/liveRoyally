import { Prisma } from "@prisma/client";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { prisma } from "./prisma";

const sqs = new SQSClient({
  region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-2",
});

function getEmailQueueUrl() {
  const queueUrl = String(process.env.EMAIL_QUEUE_URL || "").trim();
  if (!queueUrl) throw new Error("EMAIL_QUEUE_URL is required");
  return queueUrl;
}

export type QueueEmailInput = {
  idempotencyKey: string;
  templateKey: string;
  toEmail: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  payload?: Record<string, unknown>;
  userId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  scheduledAt?: Date;
  priority?: "normal" | "high";
};

export async function queueEmail(input: QueueEmailInput) {
  const job = await prisma.email_jobs.upsert({
    where: { idempotency_key: input.idempotencyKey },
    create: {
      idempotency_key: input.idempotencyKey,
      template_key: input.templateKey,
      to_email: input.toEmail.trim().toLowerCase(),
      subject: input.subject,
      text_body: input.textBody,
      html_body: input.htmlBody,
      payload: input.payload as Prisma.InputJsonValue,
      user_id: input.userId,
      related_entity_type: input.relatedEntityType,
      related_entity_id: input.relatedEntityId,
      scheduled_at: input.scheduledAt ?? new Date(),
      priority: input.priority ?? "normal",
    },
    update: {},
    select: { job_id: true, status: true },
  });

  if (job.status !== "sent" && job.status !== "failed") {
    await sqs.send(new SendMessageCommand({
      QueueUrl: getEmailQueueUrl(),
      MessageBody: JSON.stringify({ jobId: job.job_id }),
    }));
  }

  return job;
}
