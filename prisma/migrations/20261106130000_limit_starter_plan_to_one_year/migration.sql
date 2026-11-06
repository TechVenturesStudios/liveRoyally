-- Starter is free for one year from approval. Give already-approved Starter
-- partners (no paid Square subscription) the same one-year end date.
UPDATE "partner_subscriptions"
SET "trial_ends_at" = COALESCE("approved_at", "current_period_start", "created_at") + INTERVAL '1 year',
    "current_period_end" = COALESCE("approved_at", "current_period_start", "created_at") + INTERVAL '1 year',
    "cancel_at_period_end" = true,
    "updated_at" = CURRENT_TIMESTAMP
WHERE "plan" = 'starter'
  AND "status" = 'active'
  AND "billing_provider_subscription_id" IS NULL
  AND "trial_ends_at" IS NULL;
