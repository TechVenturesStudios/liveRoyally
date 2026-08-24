import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const roles = ["member", "provider", "partner", "admin"];
const rewardTiers = [
  {
    user_type: "member",
    name: "Explorer",
    min_points: 0,
    max_points: 300,
    display_order: 1,
  },
  {
    user_type: "member",
    name: "Insider",
    min_points: 301,
    max_points: 600,
    display_order: 2,
  },
  {
    user_type: "member",
    name: "Ambassador",
    min_points: 601,
    max_points: null,
    display_order: 3,
  },
  {
    user_type: "provider",
    name: "Bronze",
    min_points: 0,
    max_points: 300,
    display_order: 1,
  },
  {
    user_type: "provider",
    name: "Silver",
    min_points: 301,
    max_points: 600,
    display_order: 2,
  },
  {
    user_type: "provider",
    name: "Gold",
    min_points: 601,
    max_points: null,
    display_order: 3,
  },
  {
    user_type: "partner",
    name: "Connector",
    min_points: 0,
    max_points: 300,
    display_order: 1,
  },
  {
    user_type: "partner",
    name: "Catalyst",
    min_points: 301,
    max_points: 600,
    display_order: 2,
  },
  {
    user_type: "partner",
    name: "Champion",
    min_points: 601,
    max_points: null,
    display_order: 3,
  },
];

const rewardTasks = [
  {
    task_key: "member_create_account",
    name: "Create account",
    description: "Awarded when a member creates an account.",
    user_type: "member",
    category: "profile",
    points: 25,
    frequency_period: "lifetime",
    frequency_limit: 1,
    display_order: 1,
  },
  {
    task_key: "member_complete_profile",
    name: "Complete profile",
    description: "Awarded when a member completes their profile.",
    user_type: "member",
    category: "profile",
    points: 25,
    frequency_period: "lifetime",
    frequency_limit: 1,
    display_order: 2,
  },
  {
    task_key: "member_add_birthday",
    name: "Add birthday",
    description: "Awarded when a member adds a birthday to their profile.",
    user_type: "member",
    category: "profile",
    points: 10,
    frequency_period: "lifetime",
    frequency_limit: 1,
    display_order: 3,
  },
  {
    task_key: "member_refer_new_customer",
    name: "Refer a new customer",
    description: "Awarded for each verified referral, up to 3 total.",
    user_type: "member",
    category: "engagement",
    points: 10,
    frequency_period: "lifetime",
    frequency_limit: 3,
    display_order: 4,
  },
  {
    task_key: "member_scan_business_qr_code",
    name: "Scan a business QR code",
    description:
      "Awarded for each verified scan. Applies to all scans because network scope is not differentiated.",
    user_type: "member",
    category: "network",
    points: 20,
    frequency_period: "lifetime",
    frequency_limit: null,
    display_order: 5,
  },
  {
    task_key: "provider_create_business_profile",
    name: "Create business profile",
    description: "Awarded when a provider creates a business profile.",
    user_type: "provider",
    category: "profile",
    points: 25,
    frequency_period: "lifetime",
    frequency_limit: 1,
    display_order: 1,
  },
  {
    task_key: "provider_complete_business_profile",
    name: "Complete business profile",
    description: "Awarded when a provider completes their business profile.",
    user_type: "provider",
    category: "profile",
    points: 25,
    frequency_period: "lifetime",
    frequency_limit: 1,
    display_order: 2,
  },
  {
    task_key: "provider_add_representative",
    name: "Add representative to account",
    description: "Awarded for each representative added, up to 5 total.",
    user_type: "provider",
    category: "network",
    points: 5,
    frequency_period: "lifetime",
    frequency_limit: 5,
    display_order: 3,
  },
  {
    task_key: "provider_participate_event_campaign",
    name: "Participate in event campaign",
    description: "Awarded for each published event campaign participation.",
    user_type: "provider",
    category: "event",
    points: 20,
    frequency_period: "event",
    frequency_limit: 1,
    display_order: 4,
  },
  {
    task_key: "provider_validate_member_voucher",
    name: "Validate member voucher",
    description: "Awarded for each member voucher validation.",
    user_type: "provider",
    category: "voucher",
    points: 5,
    frequency_period: "lifetime",
    frequency_limit: null,
    display_order: 5,
  },
  {
    task_key: "partner_create_organization_profile",
    name: "Create organization profile",
    description: "Awarded when a partner creates an organization profile.",
    user_type: "partner",
    category: "profile",
    points: 25,
    frequency_period: "lifetime",
    frequency_limit: 1,
    display_order: 1,
  },
  {
    task_key: "partner_complete_organization_profile",
    name: "Complete organization profile",
    description: "Awarded when a partner completes their organization profile.",
    user_type: "partner",
    category: "profile",
    points: 25,
    frequency_period: "lifetime",
    frequency_limit: 1,
    display_order: 2,
  },
  {
    task_key: "partner_add_representative",
    name: "Add representative to account",
    description: "Awarded for each representative added, up to 5 total.",
    user_type: "partner",
    category: "network",
    points: 5,
    frequency_period: "lifetime",
    frequency_limit: 5,
    display_order: 3,
  },
  {
    task_key: "partner_create_campaign",
    name: "Create campaign",
    description: "Awarded for each published campaign.",
    user_type: "partner",
    category: "event",
    points: 20,
    frequency_period: "event",
    frequency_limit: 1,
    display_order: 4,
  },
  {
    task_key: "partner_invite_provider",
    name: "Invitation to Provider",
    description: "Awarded for each accepted provider invite.",
    user_type: "partner",
    category: "network",
    points: 5,
    frequency_period: "lifetime",
    frequency_limit: null,
    display_order: 5,
  },
];

async function main() {
  for (const roleName of roles) {
    await prisma.roles.upsert({
      where: { role_name: roleName },
      update: {},
      create: { role_name: roleName },
    });
  }

  console.log(`Seeded roles: ${roles.join(", ")}`);

  for (const tier of rewardTiers) {
    await prisma.reward_tiers.upsert({
      where: {
        user_type_name: {
          user_type: tier.user_type,
          name: tier.name,
        },
      },
      update: {
        min_points: tier.min_points,
        max_points: tier.max_points,
        display_order: tier.display_order,
        active: true,
      },
      create: {
        ...tier,
        active: true,
      },
    });
  }

  console.log(
    `Seeded reward tiers: ${rewardTiers
      .map((tier) => `${tier.user_type}:${tier.name}`)
      .join(", ")}`
  );

  for (const task of rewardTasks) {
    await prisma.reward_tasks.upsert({
      where: { task_key: task.task_key },
      update: {
        name: task.name,
        description: task.description,
        user_type: task.user_type,
        category: task.category,
        points: task.points,
        frequency_period: task.frequency_period,
        frequency_limit: task.frequency_limit,
        display_order: task.display_order,
        active: true,
      },
      create: {
        ...task,
        active: true,
      },
    });
  }

  console.log(
    `Seeded reward tasks: ${rewardTasks
      .map((task) => `${task.user_type}:${task.task_key}`)
      .join(", ")}`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
