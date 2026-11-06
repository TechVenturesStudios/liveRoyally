-- Admin-managed promo codes that grant partners a one-time free trial.
CREATE TABLE "promo_codes" (
    "promo_code_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivated_at" TIMESTAMP(6),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("promo_code_id")
);

CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

ALTER TABLE "partner_subscriptions" ADD COLUMN "promo_code_id" UUID;

CREATE INDEX "idx_partner_subscriptions_promo_code" ON "partner_subscriptions"("promo_code_id");

ALTER TABLE "partner_subscriptions"
  ADD CONSTRAINT "partner_subscriptions_promo_code_id_fkey"
  FOREIGN KEY ("promo_code_id") REFERENCES "promo_codes"("promo_code_id")
  ON DELETE SET NULL ON UPDATE NO ACTION;
