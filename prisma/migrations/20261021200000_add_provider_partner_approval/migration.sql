ALTER TABLE "provider_profiles"
ADD COLUMN IF NOT EXISTS "application_status" VARCHAR(20) NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS "declined_at" TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS "approval_email_sent_at" TIMESTAMP(6);

CREATE INDEX IF NOT EXISTS "idx_provider_profiles_application_status"
ON "provider_profiles"("application_status");
