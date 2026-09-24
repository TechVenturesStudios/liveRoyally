ALTER TABLE "partner_subscriptions"
ADD COLUMN IF NOT EXISTS "pending_plan" "PartnerSubscriptionPlan",
ADD COLUMN IF NOT EXISTS "pending_change_effective_at" TIMESTAMP(6),
ADD COLUMN IF NOT EXISTS "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false;
