import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { resolveDashboardAccount } from "../../lib/dashboard-account";
import {
  buildMemberVoucherQrCodeData,
  parseMemberVoucherQrCodeData,
} from "../../lib/qr-code";

type ProviderScanVoucherResponse =
  | {
      success: true;
      scan: {
        qrCodeData: string;
        voucherId: string;
        memberId: string;
        memberDisplayId: string | null;
        memberNetworkCode: string | null;
        claimedAt: Date | null;
        voucher: {
          eventId: string | null;
          type: string | null;
          value: unknown;
          expirationDate: Date | null;
          status: string | null;
          promoItem: string | null;
          memberPrice: number | null;
          maxRedemptions: number | null;
        };
        provider: {
          businessName: string | null;
          networkCode: string | null;
          networkName: string | null;
        };
      };
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
  res: NextApiResponse<ProviderScanVoucherResponse>
) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const account = await resolveDashboardAccount(req, ["provider"]);
    if (!account) {
      return res.status(500).json({ error: "Failed to resolve account" });
    }
    if ("error" in account) {
      return res.status(account.status).json({ error: account.error });
    }

    if (!account.actingNetworkCode) {
      return res.status(403).json({ error: "Provider network is not configured" });
    }

    const rawQrCodeData = String(req.body?.qrCodeData || "").trim();
    if (!rawQrCodeData) {
      return res.status(400).json({ error: "qrCodeData is required" });
    }

    const parsedQrCodeData = parseMemberVoucherQrCodeData(rawQrCodeData);
    if (!parsedQrCodeData) {
      return res.status(400).json({ error: "Invalid QR code" });
    }

    const qrCodeData = buildMemberVoucherQrCodeData(parsedQrCodeData);

    const exactMatches = await prisma.$queryRaw<
      Array<{
        qr_code_payload: string | null;
        voucher_id: string;
        member_id: string;
        member_display_id: string | null;
        member_network_code: string | null;
        claimed_at: Date | null;
        event_id: string | null;
        type: string | null;
        value: unknown;
        expiration_date: Date | null;
        status: string | null;
        promo_item: string | null;
        member_price: number | null;
        max_redemptions: number | null;
        business_name: string | null;
        provider_network_code: string | null;
        provider_network_name: string | null;
      }>
    >`
      SELECT
        mv.qr_code_payload,
        mv.voucher_id,
        mv.member_id,
        mu.display_id AS member_display_id,
        mp.network_code AS member_network_code,
        mv.created_at AS claimed_at,
        v.event_id,
        v.type,
        v.value,
        v.expiration_date,
        v.status,
        v.promo_item,
        v.member_price,
        v.max_redemptions,
        pp.business_name,
        pp.network_code AS provider_network_code,
        pp.network_name AS provider_network_name
      FROM member_vouchers mv
      JOIN vouchers v
        ON v.voucher_id = mv.voucher_id
      JOIN users mu
        ON mu.user_id = mv.member_id
      LEFT JOIN member_profiles mp
        ON mp.user_id = mu.user_id
      JOIN provider_profiles pp
        ON pp.user_id = v.provider_id
      WHERE mv.qr_code_payload = ${qrCodeData}
        AND pp.network_code = ${account.actingNetworkCode}
        AND LOWER(TRIM(COALESCE(v.status, ''))) = 'active'
        AND (v.expiration_date IS NULL OR v.expiration_date >= CURRENT_DATE)
      LIMIT 1;
    `;

    const fallbackMatches =
      exactMatches.length > 0
        ? []
        : await prisma.$queryRaw<
            Array<{
              qr_code_payload: string | null;
              voucher_id: string;
              member_id: string;
              member_display_id: string | null;
              member_network_code: string | null;
              claimed_at: Date | null;
              event_id: string | null;
              type: string | null;
              value: unknown;
              expiration_date: Date | null;
              status: string | null;
              promo_item: string | null;
              member_price: number | null;
              max_redemptions: number | null;
              business_name: string | null;
              provider_network_code: string | null;
              provider_network_name: string | null;
            }>
          >`
            SELECT
              mv.qr_code_payload,
              mv.voucher_id,
              mv.member_id,
              mu.display_id AS member_display_id,
              mp.network_code AS member_network_code,
              mv.created_at AS claimed_at,
              v.event_id,
              v.type,
              v.value,
              v.expiration_date,
              v.status,
              v.promo_item,
              v.member_price,
              v.max_redemptions,
              pp.business_name,
              pp.network_code AS provider_network_code,
              pp.network_name AS provider_network_name
            FROM member_vouchers mv
            JOIN vouchers v
              ON v.voucher_id = mv.voucher_id
            JOIN users mu
              ON mu.user_id = mv.member_id
            LEFT JOIN member_profiles mp
              ON mp.user_id = mu.user_id
            JOIN provider_profiles pp
              ON pp.user_id = v.provider_id
            WHERE mv.member_id = ${parsedQrCodeData.userId}::uuid
              AND v.voucher_id = ${parsedQrCodeData.voucherId}
              AND COALESCE(v.event_id, '') = ${parsedQrCodeData.eventId}
              AND COALESCE(v.type, 'N') = ${parsedQrCodeData.useCaseId}
              AND COALESCE(pp.network_code, '') = ${parsedQrCodeData.networkId}
              AND pp.network_code = ${account.actingNetworkCode}
              AND LOWER(TRIM(COALESCE(v.status, ''))) = 'active'
              AND (v.expiration_date IS NULL OR v.expiration_date >= CURRENT_DATE)
            LIMIT 1;
          `;

    const scan = exactMatches[0] || fallbackMatches[0];
    if (!scan) {
      return res.status(404).json({ error: "Voucher not found for this QR code" });
    }

    return res.status(200).json({
      success: true,
      scan: {
        qrCodeData,
        voucherId: scan.voucher_id,
        memberId: scan.member_id,
        memberDisplayId: scan.member_display_id,
        memberNetworkCode: scan.member_network_code,
        claimedAt: scan.claimed_at,
        voucher: {
          eventId: scan.event_id,
          type: scan.type,
          value: scan.value,
          expirationDate: scan.expiration_date,
          status: scan.status,
          promoItem: scan.promo_item,
          memberPrice: scan.member_price,
          maxRedemptions: scan.max_redemptions,
        },
        provider: {
          businessName: scan.business_name,
          networkCode: scan.provider_network_code,
          networkName: scan.provider_network_name,
        },
      },
    });
  } catch (error) {
    console.error("provider-scan-voucher error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to scan voucher",
    });
  }
}
