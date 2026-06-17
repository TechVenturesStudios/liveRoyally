import type { NextApiRequest } from "next";
import { prisma } from "./prisma";
import { getCognitoIdFromRequest } from "./api-auth";

export type DashboardAccountType = "member" | "provider" | "partner" | "admin";

export type DashboardAccount = {
  requestUserId: string;
  requestUserType: DashboardAccountType;
  actingUserId: string;
  actingUserType: DashboardAccountType;
  actingNetworkCode: string | null;
  actingNetworkName: string | null;
  assignmentId: string | null;
};

type AccountLookupRow = {
  user_id: string;
  user_type: DashboardAccountType | null;
  provider_network_code: string | null;
  provider_network_name: string | null;
  partner_network_code: string | null;
  partner_network_name: string | null;
};

type AssignmentLookupRow = {
  assignment_id: string;
  represented_user_id: string;
  represented_user_type: DashboardAccountType | null;
  provider_network_code: string | null;
  provider_network_name: string | null;
  partner_network_code: string | null;
  partner_network_name: string | null;
};

export async function resolveDashboardAccount(
  req: NextApiRequest,
  expectedTypes?: DashboardAccountType[]
): Promise<DashboardAccount | { error: string; status: number } | null> {
  const cognitoId = getCognitoIdFromRequest(req);

  if (!cognitoId) {
    return { error: "Not authenticated", status: 401 };
  }

  const currentUser = await prisma.users.findUnique({
    where: { cognito_id: cognitoId },
    select: {
      user_id: true,
      user_type: true,
      provider_profiles: {
        select: {
          network_code: true,
          network_name: true,
        },
      },
      partner_profiles: {
        select: {
          network_code: true,
          network_name: true,
        },
      },
    },
  });

  if (!currentUser || !currentUser.user_type) {
    return { error: "User not found", status: 404 };
  }

  let actingAccount: DashboardAccount = {
    requestUserId: currentUser.user_id,
    requestUserType: currentUser.user_type as DashboardAccountType,
    actingUserId: currentUser.user_id,
    actingUserType: currentUser.user_type as DashboardAccountType,
    actingNetworkCode:
      currentUser.provider_profiles?.network_code ??
      currentUser.partner_profiles?.network_code ??
      null,
    actingNetworkName:
      currentUser.provider_profiles?.network_name ??
      currentUser.partner_profiles?.network_name ??
      null,
    assignmentId: null,
  };

  const assignmentId = String(req.query.actingAsAssignmentId || "").trim();

  if (assignmentId && currentUser.user_type === "member") {
    const assignment = await prisma.$queryRaw<AssignmentLookupRow[]>`
      SELECT
        a.assignment_id,
        a.represented_user_id,
        ru.user_type AS represented_user_type,
        pp.network_code AS provider_network_code,
        pp.network_name AS provider_network_name,
        pr.network_code AS partner_network_code,
        pr.network_name AS partner_network_name
      FROM authorized_representative_assignments a
      INNER JOIN users ru ON ru.user_id = a.represented_user_id
      LEFT JOIN provider_profiles pp ON pp.user_id = ru.user_id
      LEFT JOIN partner_profiles pr ON pr.user_id = ru.user_id
      WHERE a.assignment_id = ${assignmentId}::uuid
        AND a.principal_user_id = ${currentUser.user_id}::uuid
        AND a.is_active = true
      LIMIT 1
    `;

    const selected = assignment[0];
    if (selected && selected.represented_user_type) {
      actingAccount = {
        ...actingAccount,
        actingUserId: selected.represented_user_id,
        actingUserType: selected.represented_user_type,
        actingNetworkCode: selected.provider_network_code ?? selected.partner_network_code ?? null,
        actingNetworkName: selected.provider_network_name ?? selected.partner_network_name ?? null,
        assignmentId: selected.assignment_id,
      };
    }
  }

  if (expectedTypes && !expectedTypes.includes(actingAccount.actingUserType)) {
    return { error: "Current account is not authorized for this view", status: 403 };
  }

  return actingAccount;
}

