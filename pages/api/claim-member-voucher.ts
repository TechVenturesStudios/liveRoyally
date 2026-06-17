import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { getCognitoIdFromRequest } from "../../lib/api-auth";

type ClaimMemberVoucherResponse =
  | {
      success: boolean;
      alreadyClaimed?: boolean;
      voucherId: string;
    }
  | {
      error: string;
    };

function setCorsHeaders(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ClaimMemberVoucherResponse>
) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
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
        user_type: true,
        member_profiles: {
          select: {
            network_code: true,
          },
        },
      },
    });

    if (!member || member.user_type !== "member" || !member.member_profiles) {
      return res.status(403).json({ error: "Current user is not a member" });
    }

    const voucherId = String(req.body?.voucherId || "").trim();
    if (!voucherId) {
      return res.status(400).json({ error: "voucherId is required" });
    }

    const voucher = await prisma.$queryRaw<Array<{ voucher_id: string; provider_network_code: string | null; expiration_date: Date | null; status: string | null }>>`
      SELECT
        v.voucher_id,
        pp.network_code AS provider_network_code,
        v.expiration_date,
        v.status
      FROM vouchers v
      JOIN provider_profiles pp
        ON pp.user_id = v.provider_id
      WHERE v.voucher_id = ${voucherId}
      LIMIT 1;
    `;

    const voucherRecord = voucher[0];
    if (!voucherRecord) {
      return res.status(404).json({ error: "Voucher not found" });
    }

    if (voucherRecord.provider_network_code !== member.member_profiles.network_code) {
      return res.status(403).json({ error: "Voucher does not belong to your network" });
    }

    if (String(voucherRecord.status || "").trim().toLowerCase() !== "active") {
      return res.status(400).json({ error: "This voucher is not active" });
    }

    if (voucherRecord.expiration_date && voucherRecord.expiration_date < new Date()) {
      return res.status(400).json({ error: "This voucher has expired" });
    }

    const existingClaim = await prisma.member_vouchers.findFirst({
      where: {
        member_id: member.user_id,
        voucher_id: voucherId,
      },
      select: {
        member_id: true,
        voucher_id: true,
      },
    });

    if (existingClaim) {
      return res.status(200).json({
        success: true,
        alreadyClaimed: true,
        voucherId,
      });
    }

    await prisma.member_vouchers.create({
      data: {
        member_id: member.user_id,
        voucher_id: voucherId,
      },
    });

    return res.status(200).json({
      success: true,
      voucherId,
    });
  } catch (error) {
    console.error("claim-member-voucher error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to claim voucher",
    });
  }
}
