ALTER TABLE "member_profiles" ADD COLUMN "birthday" DATE;

DELETE FROM "reward_tasks" WHERE "task_key" = 'member_add_birthday';
