DO $$
BEGIN
  CREATE TYPE "UserType" AS ENUM ('member', 'provider', 'partner', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "users"
ALTER COLUMN "user_type" TYPE "UserType"
USING "user_type"::"UserType";

DO $$
BEGIN
  CREATE TYPE "PartnerSubscriptionPlan" AS ENUM ('spotlight', 'standard', 'premium');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE TYPE "PartnerSubscriptionStatus" AS ENUM ('pending', 'active', 'past_due', 'canceled', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE TYPE "BillingProvider" AS ENUM ('square');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "partner_profiles"
ADD COLUMN IF NOT EXISTS "partner_code" VARCHAR(20);

CREATE UNIQUE INDEX IF NOT EXISTS "partner_profiles_partner_code_key"
ON "partner_profiles"("partner_code");

CREATE TABLE IF NOT EXISTS "partner_subscriptions" (
  "subscription_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "partner_id" UUID NOT NULL,
  "plan" "PartnerSubscriptionPlan" NOT NULL,
  "status" "PartnerSubscriptionStatus" NOT NULL DEFAULT 'pending',
  "billing_provider" "BillingProvider" NOT NULL DEFAULT 'square',
  "billing_provider_customer_id" VARCHAR(100),
  "billing_provider_subscription_id" VARCHAR(100),
  "monthly_price_cents" INTEGER NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'usd',
  "max_providers" INTEGER,
  "current_period_start" TIMESTAMP(6),
  "current_period_end" TIMESTAMP(6),
  "trial_ends_at" TIMESTAMP(6),
  "canceled_at" TIMESTAMP(6),
  "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "partner_subscriptions_pkey" PRIMARY KEY ("subscription_id"),
  CONSTRAINT "partner_subscriptions_partner_id_fkey"
    FOREIGN KEY ("partner_id") REFERENCES "users"("user_id")
    ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX IF NOT EXISTS "partner_subscriptions_billing_provider_subscription_id_key"
ON "partner_subscriptions"("billing_provider_subscription_id");

CREATE INDEX IF NOT EXISTS "idx_partner_subscriptions_partner"
ON "partner_subscriptions"("partner_id");

CREATE INDEX IF NOT EXISTS "idx_partner_subscriptions_status"
ON "partner_subscriptions"("status");
