import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { getCognitoIdFromRequest } from "../../lib/api-auth";

type MemberVouchersResponse =
  | {
      member: {
        id: string;
        displayId: string | null;
        networkName: string | null;
        networkCode: string | null;
      };
      vouchers: Array<Record<string, unknown>>;
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
  res: NextApiResponse<MemberVouchersResponse>
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
        user_type: true,
        member_profiles: {
          select: {
            network_name: true,
            network_code: true,
          },
        },
      },
    });

    if (!member || member.user_type !== "member" || !member.member_profiles) {
      return res.status(403).json({ error: "Current user is not a member" });
    }

    const vouchers = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT
        v.voucher_id,
        v.event_id,
        v.provider_id,
        v.type,
        v.value,
        v.expiration_date,
        v.status,
        v.created_at,
        v.promo_item,
        v.member_price,
        v.max_redemptions,
        mv.qr_code_payload,
        mv.created_at AS claimed_at,
        e.title AS event_title,
        e.start_date AS event_start_date,
        e.end_date AS event_end_date,
        pp.business_name AS provider_name,
        pp.business_category AS provider_category,
        pp.business_address AS provider_address,
        pp.business_city AS provider_city,
        pp.business_state AS provider_state,
        pp.business_zip AS provider_zip,
        pp.business_phone AS provider_phone,
        pp.business_email AS provider_email,
        pp.network_name AS provider_network_name,
        pp.network_code AS provider_network_code
      FROM member_vouchers mv
      JOIN vouchers v
        ON v.voucher_id = mv.voucher_id
      JOIN provider_profiles pp
        ON pp.user_id = v.provider_id
      LEFT JOIN events e
        ON e.event_id = v.event_id
      WHERE mv.member_id = ${member.user_id}::uuid
        AND LOWER(TRIM(COALESCE(v.status, ''))) = 'active'
        AND (v.expiration_date IS NULL OR v.expiration_date >= CURRENT_DATE)
      ORDER BY mv.created_at DESC;
    `;

    return res.status(200).json({
      member: {
        id: member.user_id,
        displayId: member.display_id ?? null,
        networkName: member.member_profiles.network_name ?? null,
        networkCode: member.member_profiles.network_code ?? null,
      },
      vouchers,
    });
  } catch (error) {
    console.error("member-vouchers error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch member vouchers",
    });
  }
}
