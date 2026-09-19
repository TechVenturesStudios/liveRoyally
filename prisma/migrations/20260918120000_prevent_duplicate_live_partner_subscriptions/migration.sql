-- A partner may have historical declined/canceled records, but only one
-- pending, active, or past-due subscription may exist at a time.
CREATE UNIQUE INDEX IF NOT EXISTS "uq_partner_one_live_subscription"
ON "partner_subscriptions" ("partner_id")
WHERE "status" IN ('pending', 'active', 'past_due');
