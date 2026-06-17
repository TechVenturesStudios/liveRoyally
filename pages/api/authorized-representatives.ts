import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { resolveDashboardAccount } from "../../lib/dashboard-account";

type AuthorizedRepresentative = {
  assignmentId: string;
  memberId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  memberSince: string;
};

type NetworkMember = {
  id: string;
  displayId: string | null;
  name: string;
  email: string;
  phone: string;
  memberSince: string;
};

type AuthorizedRepresentativesResponse =
  | {
      organization: {
        id: string;
        type: "provider" | "partner";
        networkCode: string | null;
        networkName: string | null;
      };
      representatives: AuthorizedRepresentative[];
      networkMembers: NetworkMember[];
    }
  | {
      assignment: AuthorizedRepresentative;
    }
  | {
      error: string;
    };

function setCorsHeaders(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,POST,DELETE");
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuthorizedRepresentativesResponse>
) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method === "GET") {
      const account = await resolveDashboardAccount(req, ["partner", "provider"]);
      if (!account) {
        return res.status(500).json({ error: "Failed to resolve account" });
      }
      if ("error" in account) {
        return res.status(account.status).json({ error: account.error });
      }

      const networkMembers = await prisma.$queryRaw<NetworkMember[]>`
        SELECT
          u.user_id AS id,
          u.display_id AS "displayId",
          TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS name,
          u.email,
          COALESCE(u.phone_number, '') AS phone,
          COALESCE(m.created_at, u.created_at) AS "memberSince"
        FROM users u
        INNER JOIN member_profiles m ON m.user_id = u.user_id
        WHERE u.user_type = 'member'
          AND m.network_code = ${account.actingNetworkCode}
        ORDER BY COALESCE(u.first_name, u.email) ASC
      `;

      const representatives = await prisma.$queryRaw<AuthorizedRepresentative[]>`
        SELECT
          a.assignment_id AS "assignmentId",
          u.user_id AS "memberId",
          TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS name,
          u.email,
          COALESCE(u.phone_number, '') AS phone,
          CASE
            WHEN a.is_active THEN 'Assistant Representative'
            ELSE 'Inactive'
          END AS role,
          CASE
            WHEN a.is_active THEN 'active'
            ELSE 'inactive'
          END AS status,
          COALESCE(m.created_at, u.created_at) AS "memberSince"
        FROM authorized_representative_assignments a
        INNER JOIN users u ON u.user_id = a.principal_user_id
        LEFT JOIN member_profiles m ON m.user_id = u.user_id
        WHERE a.represented_user_id = ${account.actingUserId}::uuid
        ORDER BY a.created_at DESC
      `;

      return res.status(200).json({
        organization: {
          id: account.actingUserId,
          type: account.actingUserType as "provider" | "partner",
          networkCode: account.actingNetworkCode,
          networkName: account.actingNetworkName,
        },
        representatives: representatives.map((rep) => ({
          ...rep,
          memberSince: formatDate(rep.memberSince),
        })),
        networkMembers: networkMembers.map((member) => ({
          ...member,
          memberSince: formatDate(member.memberSince),
        })),
      });
    }

    if (req.method === "POST") {
      const account = await resolveDashboardAccount(req, ["partner", "provider"]);
      if (!account) {
        return res.status(500).json({ error: "Failed to resolve account" });
      }
      if ("error" in account) {
        return res.status(account.status).json({ error: account.error });
      }

      const body = req.body ?? {};
      const memberId = String(body.memberId || body.principalUserId || "").trim();

      if (!memberId) {
        return res.status(400).json({ error: "memberId is required" });
      }

      const eligibleMember = await prisma.$queryRaw<NetworkMember[]>`
        SELECT
          u.user_id AS id,
          u.display_id AS "displayId",
          TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS name,
          u.email,
          COALESCE(u.phone_number, '') AS phone,
          COALESCE(m.created_at, u.created_at) AS "memberSince"
        FROM users u
        INNER JOIN member_profiles m ON m.user_id = u.user_id
        WHERE u.user_id = ${memberId}::uuid
          AND u.user_type = 'member'
          AND m.network_code = ${account.actingNetworkCode}
        LIMIT 1
      `;

      if (!eligibleMember[0]) {
        return res.status(404).json({ error: "Member not found in this network" });
      }

      const existing = await prisma.$queryRaw<AuthorizedRepresentative[]>`
        SELECT
          a.assignment_id AS "assignmentId",
          u.user_id AS "memberId",
          TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS name,
          u.email,
          COALESCE(u.phone_number, '') AS phone,
          CASE WHEN a.is_active THEN 'Assistant Representative' ELSE 'Inactive' END AS role,
          CASE WHEN a.is_active THEN 'active' ELSE 'inactive' END AS status,
          COALESCE(m.created_at, u.created_at) AS "memberSince"
        FROM authorized_representative_assignments a
        INNER JOIN users u ON u.user_id = a.principal_user_id
        LEFT JOIN member_profiles m ON m.user_id = u.user_id
        WHERE a.principal_user_id = ${memberId}::uuid
          AND a.represented_user_id = ${account.actingUserId}::uuid
        LIMIT 1
      `;

      if (existing[0]) {
        return res.status(200).json({ assignment: existing[0] });
      }

      const inserted = await prisma.$queryRaw<AuthorizedRepresentative[]>`
        INSERT INTO authorized_representative_assignments (
          principal_user_id,
          represented_user_id,
          is_active
        )
        VALUES (
          ${memberId}::uuid,
          ${account.actingUserId}::uuid,
          true
        )
        RETURNING assignment_id AS "assignmentId"
      `;

      const assignment = inserted[0];

      return res.status(200).json({
        assignment: {
          assignmentId: assignment.assignmentId,
          memberId: eligibleMember[0].id,
          name: eligibleMember[0].name,
          email: eligibleMember[0].email,
          phone: eligibleMember[0].phone || "",
          role: "Assistant Representative",
          status: "active",
          memberSince: eligibleMember[0].memberSince,
        },
      });
    }

    if (req.method === "DELETE") {
      const account = await resolveDashboardAccount(req, ["partner", "provider"]);
      if (!account) {
        return res.status(500).json({ error: "Failed to resolve account" });
      }
      if ("error" in account) {
        return res.status(account.status).json({ error: account.error });
      }

      const body = req.body ?? {};
      const assignmentId = String(body.assignmentId || "").trim();

      if (!assignmentId) {
        return res.status(400).json({ error: "assignmentId is required" });
      }

      await prisma.$executeRaw`
        DELETE FROM authorized_representative_assignments
        WHERE assignment_id = ${assignmentId}::uuid
          AND represented_user_id = ${account.actingUserId}::uuid
      `;

      return res.status(200).json({
        assignment: {
          assignmentId,
          memberId: "",
          name: "",
          email: "",
          phone: "",
          role: "Assistant Representative",
          status: "inactive",
          memberSince: "",
        },
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("authorized-representatives error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to manage authorized representatives",
    });
  }
}
