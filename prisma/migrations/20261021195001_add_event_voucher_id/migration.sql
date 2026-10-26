/*
  Warnings:

  - A unique constraint covering the columns `[voucher_id]` on the table `event_provider_invites` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "referrals" DROP CONSTRAINT "referrals_referred_user_id_fkey";

-- DropForeignKey
ALTER TABLE "referrals" DROP CONSTRAINT "referrals_referrer_id_fkey";

-- DropIndex
DROP INDEX "idx_authorized_rep_invite_status";

-- DropIndex
DROP INDEX "idx_events_published";

-- DropIndex
DROP INDEX "purchases_member_voucher_unique";

-- AlterTable
ALTER TABLE "email_jobs" ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "event_provider_invites_voucher_id_key" ON "event_provider_invites"("voucher_id");

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
