CREATE TYPE "EmailJobStatus" AS ENUM ('queued', 'processing', 'sent', 'failed', 'canceled');
CREATE TYPE "EmailJobPriority" AS ENUM ('normal', 'high');

CREATE TABLE "email_jobs" (
  "job_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "idempotency_key" VARCHAR(255) NOT NULL,
  "template_key" VARCHAR(100) NOT NULL,
  "status" "EmailJobStatus" NOT NULL DEFAULT 'queued',
  "priority" "EmailJobPriority" NOT NULL DEFAULT 'normal',
  "to_email" VARCHAR(255) NOT NULL,
  "subject" VARCHAR(255) NOT NULL,
  "text_body" TEXT NOT NULL,
  "html_body" TEXT NOT NULL,
  "payload" JSONB,
  "user_id" UUID,
  "related_entity_type" VARCHAR(50),
  "related_entity_id" VARCHAR(100),
  "scheduled_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processing_started_at" TIMESTAMP(6),
  "sent_at" TIMESTAMP(6),
  "provider_message_id" VARCHAR(255),
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "last_error" TEXT,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_jobs_pkey" PRIMARY KEY ("job_id")
);

CREATE UNIQUE INDEX "email_jobs_idempotency_key_key" ON "email_jobs"("idempotency_key");
CREATE INDEX "idx_email_jobs_delivery" ON "email_jobs"("status", "scheduled_at");
CREATE INDEX "idx_email_jobs_template" ON "email_jobs"("template_key");
CREATE INDEX "idx_email_jobs_created" ON "email_jobs"("created_at");
CREATE INDEX "idx_email_jobs_user" ON "email_jobs"("user_id");
