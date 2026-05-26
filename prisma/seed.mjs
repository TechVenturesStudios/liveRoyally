import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const roles = ["member", "provider", "partner", "admin"];

async function main() {
  for (const roleName of roles) {
    await prisma.roles.upsert({
      where: { role_name: roleName },
      update: {},
      create: { role_name: roleName },
    });
  }

  console.log(`Seeded roles: ${roles.join(", ")}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
