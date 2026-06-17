ALTER TABLE "events"
ADD COLUMN IF NOT EXISTS "location" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "event_time" VARCHAR(50),
ADD COLUMN IF NOT EXISTS "network_points" INTEGER,
ADD COLUMN IF NOT EXISTS "response_deadline" DATE;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EventProviderInviteStatus') THEN
    CREATE TYPE "EventProviderInviteStatus" AS ENUM ('pending', 'accepted', 'declined', 'expired');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "event_provider_invites" (
  "invite_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "event_id" VARCHAR(50) NOT NULL,
  "provider_id" UUID NOT NULL,
  "partner_id" UUID NOT NULL,
  "status" "EventProviderInviteStatus" NOT NULL DEFAULT 'pending',
  "invited_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "responded_at" TIMESTAMP(6),
  "voucher_id" VARCHAR(50),
  "invite_message" TEXT,
  CONSTRAINT "event_provider_invites_pkey" PRIMARY KEY ("invite_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_event_provider_invite"
ON "event_provider_invites"("event_id", "provider_id");

CREATE UNIQUE INDEX IF NOT EXISTS "event_provider_invites_voucher_id_key"
ON "event_provider_invites"("voucher_id")
WHERE "voucher_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_event_provider_invites_event"
ON "event_provider_invites"("event_id");

CREATE INDEX IF NOT EXISTS "idx_event_provider_invites_partner"
ON "event_provider_invites"("partner_id");

CREATE INDEX IF NOT EXISTS "idx_event_provider_invites_provider"
ON "event_provider_invites"("provider_id");

CREATE INDEX IF NOT EXISTS "idx_event_provider_invites_status"
ON "event_provider_invites"("status");

ALTER TABLE "event_provider_invites"
ADD CONSTRAINT "event_provider_invites_event_id_fkey"
FOREIGN KEY ("event_id")
REFERENCES "events"("event_id")
ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "event_provider_invites"
ADD CONSTRAINT "event_provider_invites_provider_id_fkey"
FOREIGN KEY ("provider_id")
REFERENCES "users"("user_id")
ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "event_provider_invites"
ADD CONSTRAINT "event_provider_invites_partner_id_fkey"
FOREIGN KEY ("partner_id")
REFERENCES "users"("user_id")
ON DELETE CASCADE ON UPDATE NO ACTION;
