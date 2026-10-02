CREATE TABLE "referrals" (
    "referral_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "referrer_id" UUID NOT NULL,
    "invitee_email" VARCHAR(150) NOT NULL,
    "referral_token" VARCHAR(80) NOT NULL,
    "referred_user_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "registered_at" TIMESTAMP(6),
    "rewarded_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "referrals_pkey" PRIMARY KEY ("referral_id")
);

CREATE UNIQUE INDEX "referrals_referral_token_key" ON "referrals"("referral_token");
CREATE UNIQUE INDEX "referrals_referred_user_id_key" ON "referrals"("referred_user_id");
CREATE INDEX "idx_referrals_referrer" ON "referrals"("referrer_id");
CREATE INDEX "idx_referrals_invitee_email" ON "referrals"("invitee_email");
CREATE INDEX "idx_referrals_status" ON "referrals"("status");

ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_fkey"
  FOREIGN KEY ("referrer_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_fkey"
  FOREIGN KEY ("referred_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;
