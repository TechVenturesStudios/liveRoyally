ALTER TABLE "partner_subscriptions"
ADD COLUMN IF NOT EXISTS "billing_provider_card_id" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMP(6);
