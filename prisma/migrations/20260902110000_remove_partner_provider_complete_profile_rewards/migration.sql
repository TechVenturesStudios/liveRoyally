DELETE FROM "reward_tasks"
WHERE "task_key" IN (
  'provider_complete_business_profile',
  'partner_complete_organization_profile'
);
