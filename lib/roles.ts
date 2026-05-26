import type { Prisma } from "@prisma/client";

export async function getOrCreateRole(
  tx: Prisma.TransactionClient,
  roleName: string
) {
  return tx.roles.upsert({
    where: { role_name: roleName },
    update: {},
    create: { role_name: roleName },
    select: { role_id: true },
  });
}
