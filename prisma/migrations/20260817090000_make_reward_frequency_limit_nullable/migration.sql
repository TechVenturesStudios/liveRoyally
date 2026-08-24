-- Allow reward tasks to have no cap within their frequency period.
ALTER TABLE "reward_tasks"
ALTER COLUMN "frequency_limit" DROP NOT NULL;
