import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { getCognitoIdFromRequest } from "../../lib/api-auth";
import { awardRewardTask } from "../../lib/rewards";

type RepAssignmentResponse =
  | {
      member: {
        id: string;
        displayId: string | null;
        name: string;
        email: string;
      };
      assignments: Array<{
        assignmentId: string;
        representedUserId: string;
        representedUserType: "partner" | "provider" | "admin";
        representedName: string;
        representedNetworkName: string | null;
        representedNetworkCode: string | null;
        status: "pending" | "accepted" | "declined";
        invitedAt: string | null;
      }>;
    }
  | {
      error: string;
    }
  | {
      ok: true;
    };

function setCorsHeaders(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,POST");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RepAssignmentResponse>
) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const cognitoId = getCognitoIdFromRequest(req);

    if (!cognitoId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const member = await prisma.users.findUnique({
      where: { cognito_id: cognitoId },
      select: {
        user_id: true,
        display_id: true,
        email: true,
        first_name: true,
        last_name: true,
        user_type: true,
      },
    });

    if (!member) {
      return res.status(404).json({ error: "Current user not found" });
    }

    if (req.method === "POST") {
      const assignmentId = String(req.body?.assignmentId || "").trim();
      const action = String(req.body?.action || "").trim().toLowerCase();
      if (!assignmentId || !["accept", "decline"].includes(action)) {
        return res.status(400).json({ error: "assignmentId and a valid action are required" });
      }

      const result = await prisma.$transaction(async (tx) => {
        const pending = await tx.$queryRaw<Array<{ representedUserId: string; representedUserType: string }>>`
          SELECT a.represented_user_id AS "representedUserId", u.user_type AS "representedUserType"
          FROM authorized_representative_assignments a
          INNER JOIN users u ON u.user_id = a.represented_user_id
          WHERE a.assignment_id = ${assignmentId}::uuid
            AND a.principal_user_id = ${member.user_id}::uuid
            AND a.invite_status = 'pending'
          LIMIT 1
        `;
        if (!pending[0]) return false;

        const accepted = action === "accept";
        await tx.$executeRaw`
          UPDATE authorized_representative_assignments
          SET invite_status = ${accepted ? "accepted" : "declined"},
              is_active = ${accepted},
              responded_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE assignment_id = ${assignmentId}::uuid
            AND principal_user_id = ${member.user_id}::uuid
            AND invite_status = 'pending'
        `;

        if (accepted && pending[0].representedUserType !== "admin") {
          await awardRewardTask(tx, {
            userId: pending[0].representedUserId,
            taskKey: pending[0].representedUserType === "partner"
              ? "partner_add_representative"
              : "provider_add_representative",
            description: "Representative accepted invite",
          });
        }
        return true;
      });

      if (!result) return res.status(404).json({ error: "Pending representative invite not found" });
      return res.status(200).json({ ok: true });
    }

    const assignments = await prisma.$queryRaw<
      Array<{
        assignmentId: string;
        representedUserId: string;
        representedUserType: "partner" | "provider" | "admin";
        representedName: string;
        representedNetworkName: string | null;
        representedNetworkCode: string | null;
        status: "pending" | "accepted" | "declined";
        invitedAt: string | null;
      }>
    >`
      SELECT
        a.assignment_id AS "assignmentId",
        a.represented_user_id AS "representedUserId",
        ru.user_type AS "representedUserType",
        COALESCE(pp.org_name, pr.business_name, ru.email) AS "representedName",
        COALESCE(pp.network_name, pr.network_name) AS "representedNetworkName",
        COALESCE(pp.network_code, pr.network_code) AS "representedNetworkCode"
        ,a.invite_status AS status
        ,a.created_at AS "invitedAt"
      FROM authorized_representative_assignments a
      INNER JOIN users ru ON ru.user_id = a.represented_user_id
      LEFT JOIN partner_profiles pp ON pp.user_id = ru.user_id
      LEFT JOIN provider_profiles pr ON pr.user_id = ru.user_id
      WHERE a.principal_user_id = ${member.user_id}::uuid
        AND a.invite_status IN ('pending', 'accepted')
      ORDER BY a.created_at DESC
    `;

    return res.status(200).json({
      member: {
        id: member.user_id,
        displayId: member.display_id,
        name: [member.first_name, member.last_name].filter(Boolean).join(" ") || member.email,
        email: member.email,
      },
      assignments,
    });
  } catch (error) {
    console.error("rep-assignments error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to load representative assignments",
    });
  }
}
