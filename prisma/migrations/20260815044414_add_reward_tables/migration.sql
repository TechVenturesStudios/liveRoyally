/*
  Warnings:

  - A unique constraint covering the columns `[voucher_id]` on the table `event_provider_invites` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RewardFrequencyPeriod" AS ENUM ('lifetime', 'year', 'month', 'week', 'event');

-- CreateEnum
CREATE TYPE "RewardTaskCategory" AS ENUM ('profile', 'event', 'voucher', 'network', 'engagement', 'milestone', 'streak', 'other');

-- CreateEnum
CREATE TYPE "RewardPointTransactionType" AS ENUM ('task_completion', 'streak_bonus', 'manual_adjustment', 'reward_redemption', 'expiration');

-- CreateEnum
CREATE TYPE "RewardGoalMetric" AS ENUM ('vouchers_redeemed', 'events_attended', 'active_networks', 'points_earned', 'other');

-- DropIndex
DROP INDEX "idx_member_vouchers_qr_code_payload";

-- CreateTable
CREATE TABLE "reward_tiers" (
    "tier_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_type" "UserType" NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "min_points" INTEGER NOT NULL,
    "max_points" INTEGER,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "reward_tiers_pkey" PRIMARY KEY ("tier_id")
);

-- CreateTable
CREATE TABLE "reward_accounts" (
    "reward_account_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "reward_year" INTEGER NOT NULL,
    "points_balance" INTEGER NOT NULL DEFAULT 0,
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "points_spent" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "reward_accounts_pkey" PRIMARY KEY ("reward_account_id")
);

-- CreateTable
CREATE TABLE "reward_tasks" (
    "task_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "task_key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "user_type" "UserType" NOT NULL,
    "category" "RewardTaskCategory" NOT NULL,
    "points" INTEGER NOT NULL,
    "frequency_period" "RewardFrequencyPeriod" NOT NULL,
    "frequency_limit" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "badge_name" VARCHAR(100),
    "badge_description" TEXT,
    "badge_icon" VARCHAR(100),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_tasks_pkey" PRIMARY KEY ("task_id")
);

-- CreateTable
CREATE TABLE "reward_task_completions" (
    "completion_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "reward_year" INTEGER NOT NULL,
    "event_id" VARCHAR(50),
    "points_awarded" INTEGER NOT NULL,
    "completed_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_task_completions_pkey" PRIMARY KEY ("completion_id")
);

-- CreateTable
CREATE TABLE "reward_point_transactions" (
    "transaction_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "reward_account_id" UUID NOT NULL,
    "task_id" UUID,
    "completion_id" UUID,
    "transaction_type" "RewardPointTransactionType" NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_point_transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "reward_streaks" (
    "streak_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "reward_year" INTEGER NOT NULL,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_activity_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_streaks_pkey" PRIMARY KEY ("streak_id")
);

-- CreateIndex
CREATE INDEX "idx_reward_tiers_user_type" ON "reward_tiers"("user_type");

-- CreateIndex
CREATE INDEX "idx_reward_tiers_min_points" ON "reward_tiers"("min_points");

-- CreateIndex
CREATE UNIQUE INDEX "uq_reward_tier_user_type_name" ON "reward_tiers"("user_type", "name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_reward_tier_user_type_order" ON "reward_tiers"("user_type", "display_order");

-- CreateIndex
CREATE INDEX "idx_reward_accounts_user" ON "reward_accounts"("user_id");

-- CreateIndex
CREATE INDEX "idx_reward_accounts_year" ON "reward_accounts"("reward_year");

-- CreateIndex
CREATE UNIQUE INDEX "uq_reward_account_user_year" ON "reward_accounts"("user_id", "reward_year");

-- CreateIndex
CREATE UNIQUE INDEX "reward_tasks_task_key_key" ON "reward_tasks"("task_key");

-- CreateIndex
CREATE INDEX "idx_reward_tasks_user_type" ON "reward_tasks"("user_type");

-- CreateIndex
CREATE INDEX "idx_reward_tasks_category" ON "reward_tasks"("category");

-- CreateIndex
CREATE INDEX "idx_reward_tasks_active" ON "reward_tasks"("active");

-- CreateIndex
CREATE INDEX "idx_reward_tasks_display_order" ON "reward_tasks"("display_order");

-- CreateIndex
CREATE INDEX "idx_reward_completions_user" ON "reward_task_completions"("user_id");

-- CreateIndex
CREATE INDEX "idx_reward_completions_task" ON "reward_task_completions"("task_id");

-- CreateIndex
CREATE INDEX "idx_reward_completions_year" ON "reward_task_completions"("reward_year");

-- CreateIndex
CREATE INDEX "idx_reward_completions_event" ON "reward_task_completions"("event_id");

-- CreateIndex
CREATE INDEX "idx_reward_completions_user_task_year" ON "reward_task_completions"("user_id", "task_id", "reward_year");

-- CreateIndex
CREATE INDEX "idx_reward_transactions_user" ON "reward_point_transactions"("user_id");

-- CreateIndex
CREATE INDEX "idx_reward_transactions_account" ON "reward_point_transactions"("reward_account_id");

-- CreateIndex
CREATE INDEX "idx_reward_transactions_task" ON "reward_point_transactions"("task_id");

-- CreateIndex
CREATE INDEX "idx_reward_transactions_completion" ON "reward_point_transactions"("completion_id");

-- CreateIndex
CREATE INDEX "idx_reward_transactions_created" ON "reward_point_transactions"("created_at");

-- CreateIndex
CREATE INDEX "idx_reward_streaks_user" ON "reward_streaks"("user_id");

-- CreateIndex
CREATE INDEX "idx_reward_streaks_year" ON "reward_streaks"("reward_year");

-- CreateIndex
CREATE UNIQUE INDEX "uq_reward_streak_user_year" ON "reward_streaks"("user_id", "reward_year");

-- AddForeignKey
ALTER TABLE "reward_accounts" ADD CONSTRAINT "reward_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_task_completions" ADD CONSTRAINT "reward_task_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_task_completions" ADD CONSTRAINT "reward_task_completions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "reward_tasks"("task_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_task_completions" ADD CONSTRAINT "reward_task_completions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_task_completions" ADD CONSTRAINT "reward_task_completions_user_id_reward_year_fkey" FOREIGN KEY ("user_id", "reward_year") REFERENCES "reward_accounts"("user_id", "reward_year") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_point_transactions" ADD CONSTRAINT "reward_point_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_point_transactions" ADD CONSTRAINT "reward_point_transactions_reward_account_id_fkey" FOREIGN KEY ("reward_account_id") REFERENCES "reward_accounts"("reward_account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_point_transactions" ADD CONSTRAINT "reward_point_transactions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "reward_tasks"("task_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_streaks" ADD CONSTRAINT "reward_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
