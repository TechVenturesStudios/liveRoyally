import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { getCognitoIdFromRequest } from "../../lib/api-auth";

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
        representedUserType: "partner" | "provider";
        representedName: string;
        representedNetworkName: string | null;
        representedNetworkCode: string | null;
      }>;
    }
  | {
      error: string;
    };

function setCorsHeaders(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RepAssignmentResponse>
) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
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

    if (!member || member.user_type !== "member") {
      return res.status(403).json({ error: "Current user is not a member" });
    }

    const assignments = await prisma.$queryRaw<
      Array<{
        assignmentId: string;
        representedUserId: string;
        representedUserType: "partner" | "provider";
        representedName: string;
        representedNetworkName: string | null;
        representedNetworkCode: string | null;
      }>
    >`
      SELECT
        a.assignment_id AS "assignmentId",
        a.represented_user_id AS "representedUserId",
        ru.user_type AS "representedUserType",
        COALESCE(pp.org_name, pr.business_name, ru.email) AS "representedName",
        COALESCE(pp.network_name, pr.network_name) AS "representedNetworkName",
        COALESCE(pp.network_code, pr.network_code) AS "representedNetworkCode"
      FROM authorized_representative_assignments a
      INNER JOIN users ru ON ru.user_id = a.represented_user_id
      LEFT JOIN partner_profiles pp ON pp.user_id = ru.user_id
      LEFT JOIN provider_profiles pr ON pr.user_id = ru.user_id
      WHERE a.principal_user_id = ${member.user_id}::uuid
        AND a.is_active = true
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

