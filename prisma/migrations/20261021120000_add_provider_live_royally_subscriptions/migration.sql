CREATE TABLE "provider_subscriptions" (
  "subscription_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "provider_id" UUID NOT NULL,
  "status" "PartnerSubscriptionStatus" NOT NULL DEFAULT 'pending',
  "billing_provider" "BillingProvider" NOT NULL DEFAULT 'square',
  "billing_provider_customer_id" VARCHAR(100),
  "billing_provider_card_id" VARCHAR(100),
  "billing_provider_subscription_id" VARCHAR(100),
  "annual_price_cents" INTEGER NOT NULL DEFAULT 10000,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'usd',
  "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
  "current_period_start" TIMESTAMP(6),
  "current_period_end" TIMESTAMP(6),
  "canceled_at" TIMESTAMP(6),
  "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_subscriptions_pkey" PRIMARY KEY ("subscription_id"),
  CONSTRAINT "provider_subscriptions_billing_provider_subscription_id_key" UNIQUE ("billing_provider_subscription_id"),
  CONSTRAINT "provider_subscriptions_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE INDEX "idx_provider_subscriptions_provider" ON "provider_subscriptions"("provider_id");
CREATE INDEX "idx_provider_subscriptions_status" ON "provider_subscriptions"("status");

CREATE TABLE "provider_join_tokens" (
  "token_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "token_hash" VARCHAR(128) NOT NULL,
  "provider_id" UUID NOT NULL,
  "partner_id" UUID NOT NULL,
  "expires_at" TIMESTAMP(6) NOT NULL,
  "used_at" TIMESTAMP(6),
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_join_tokens_pkey" PRIMARY KEY ("token_id"),
  CONSTRAINT "provider_join_tokens_token_hash_key" UNIQUE ("token_hash"),
  CONSTRAINT "provider_join_tokens_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE INDEX "idx_provider_join_tokens_provider" ON "provider_join_tokens"("provider_id");
CREATE INDEX "idx_provider_join_tokens_expires" ON "provider_join_tokens"("expires_at");
