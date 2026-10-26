import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { getCognitoIdFromRequest } from "../../lib/api-auth";
import { buildMemberVoucherQrCodeData } from "../../lib/qr-code";
import { awardRewardTask } from "../../lib/rewards";
import { createSquarePayment } from "../../lib/square-partner-billing";
import { decryptSquareToken } from "../../lib/square-oauth";

type ClaimMemberVoucherResponse =
  | {
      success: boolean;
      alreadyClaimed?: boolean;
      voucherId: string;
      qrCodeData?: string;
      paymentId?: string;
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
        email: true,
        user_type: true,
        member_profiles: { select: { network_code: true } },
      },
    });

    if (!member || member.user_type !== "member" || !member.member_profiles) {
      return res.status(403).json({ error: "Current user is not a member" });
    }

    const voucherId = String(req.body?.voucherId || "").trim();
    if (!voucherId) {
      return res.status(400).json({ error: "voucherId is required" });
    }

    const voucher = await prisma.$queryRaw<Array<{
      voucher_id: string;
      event_id: string | null;
      type: string | null;
      provider_network_code: string | null;
      expiration_date: Date | null;
      status: string | null;
      event_published: boolean;
      total_vouchers_available: number | null;
      member_price: number | null;
      partner_id: string | null;
      partner_email: string | null;
      partner_square_access_token: string | null;
      partner_square_location_id: string | null;
    }>>`
      SELECT
        v.voucher_id,
        v.event_id,
        v.type,
        pp.network_code AS provider_network_code,
        v.expiration_date,
        v.status,
        e.published AS event_published,
        e.total_vouchers_available
        ,e.member_price
        ,e.partner_id
        ,u.email AS partner_email
        ,psc.access_token_ciphertext AS partner_square_access_token
        ,psc.location_id AS partner_square_location_id
      FROM vouchers v
      JOIN provider_profiles pp
        ON pp.user_id = v.provider_id
      JOIN events e
        ON e.event_id = v.event_id
      LEFT JOIN users u
        ON u.user_id = e.partner_id
      LEFT JOIN partner_square_connections psc
        ON psc.user_id = e.partner_id
      WHERE v.voucher_id = ${voucherId}
      LIMIT 1;
    `;

    const voucherRecord = voucher[0];
    if (!voucherRecord) {
      return res.status(404).json({ error: "Voucher not found" });
    }

    if (!voucherRecord.event_id) {
      return res.status(400).json({ error: "Voucher is missing an event" });
    }

    if (String(voucherRecord.status || "").trim().toLowerCase() !== "active") {
      return res.status(400).json({ error: "This voucher is not active" });
    }

    if (!voucherRecord.event_published) {
      return res.status(400).json({ error: "This event has not been published" });
    }

    if (voucherRecord.expiration_date && voucherRecord.expiration_date < new Date()) {
      return res.status(400).json({ error: "This voucher has expired" });
    }

    const requestedPaymentToken = String(req.body?.paymentToken || "").trim();
    const memberPrice = Number(voucherRecord.member_price ?? 0);
    const isPaidVoucher = Number.isFinite(memberPrice) && memberPrice > 0;
    if (isPaidVoucher && !requestedPaymentToken) {
      return res.status(402).json({ error: "A card payment is required for this voucher" });
    }

    const existingClaim = await prisma.member_vouchers.findUnique({
      where: { member_id_voucher_id: { member_id: member.user_id, voucher_id: voucherId } },
      select: { member_id: true },
    });
    if (existingClaim) {
      return res.status(200).json({ success: true, alreadyClaimed: true, voucherId });
    }

    let paymentId: string | undefined;
    if (isPaidVoucher) {
      if (!voucherRecord.partner_square_access_token || !voucherRecord.partner_square_location_id) {
        return res.status(400).json({ error: "This partner is not ready to accept voucher payments" });
      }

      paymentId = (await createSquarePayment({
        accessToken: decryptSquareToken(voucherRecord.partner_square_access_token),
        locationId: voucherRecord.partner_square_location_id,
        sourceId: requestedPaymentToken,
        amountCents: Math.round(memberPrice * 100),
        referenceId: `${member.user_id}:${voucherId}`,
        buyerEmail: member.email,
        note: `Voucher ${voucherId}`,
      })).id;
    }

    const result = await prisma.$transaction(async (tx) => {
      // Serialize claims for this voucher so the event-level cap cannot be exceeded by concurrent claims.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${voucherId}, 0));`;

      const existingClaim = await tx.member_vouchers.findFirst({
        where: {
          member_id: member.user_id,
          voucher_id: voucherId,
        },
        select: {
          member_id: true,
          voucher_id: true,
        },
      });

      if (!existingClaim && voucherRecord.total_vouchers_available !== null) {
        const claimCount = await tx.member_vouchers.count({ where: { voucher_id: voucherId } });
        if (claimCount >= voucherRecord.total_vouchers_available) {
          throw new Error("This voucher has reached its claim limit");
        }
      }

      const qrCodeData = buildMemberVoucherQrCodeData({
        voucherId,
        eventId: voucherRecord.event_id,
        useCaseId: String(voucherRecord.type || "N"),
        networkId:
          voucherRecord.provider_network_code || member.member_profiles.network_code || "NETWORK",
        userId: member.user_id,
      });

      await tx.$executeRaw`
        INSERT INTO member_vouchers (member_id, voucher_id, qr_code_payload)
        VALUES (${member.user_id}::uuid, ${voucherId}, ${qrCodeData})
        ON CONFLICT (member_id, voucher_id)
        DO UPDATE SET qr_code_payload = EXCLUDED.qr_code_payload;
      `;

      if (!existingClaim) {
        await awardRewardTask(tx, {
          userId: member.user_id,
          taskKey: "member_scan_business_qr_code",
          eventId: voucherRecord.event_id,
          description: "Business QR code scanned",
        });
      }

      if (paymentId) {
        await tx.purchases.create({
          data: {
            member_id: member.user_id,
            voucher_id: voucherId,
            status: "completed",
          },
        });
      }

      return {
        success: true,
        alreadyClaimed: Boolean(existingClaim),
        voucherId,
        qrCodeData,
        paymentId,
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("claim-member-voucher error:", error);
    if (error instanceof Error && error.message === "This voucher has reached its claim limit") {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to claim voucher",
    });
  }
}
