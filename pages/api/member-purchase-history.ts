import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { getCognitoIdFromRequest } from "../../lib/api-auth";
import type { MemberPurchaseRecord } from "@/utils/memberPurchaseHistory";

type MemberPurchaseHistoryResponse =
  | {
      member: {
        id: string;
        displayId: string | null;
      };
      purchases: MemberPurchaseRecord[];
    }
  | {
      error: string;
    };

function setCorsHeaders(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET");
}

function toNumber(value: unknown) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatPurchaseTitle(args: {
  providerName: string;
  voucherType: string | null;
  voucherValue: unknown;
  promoItem: string | null;
}) {
  const providerName = args.providerName || "Provider";
  const voucherType = String(args.voucherType || "").trim().toUpperCase();
  const numericValue = toNumber(args.voucherValue);

  if (voucherType === "A") {
    return numericValue > 0 ? `${numericValue}% Off at ${providerName}` : `Discount at ${providerName}`;
  }

  if (voucherType === "B") {
    return numericValue > 0 ? `$${numericValue.toFixed(2)} Off at ${providerName}` : `Discount at ${providerName}`;
  }

  if (voucherType === "C") {
    const promoItem = args.promoItem?.trim();
    return promoItem ? `Free ${promoItem} at ${providerName}` : `Free offer at ${providerName}`;
  }

  return `Purchase at ${providerName}`;
}

function calculatePurchaseAmounts(args: {
  voucherType: string | null;
  voucherValue: unknown;
  memberPrice: unknown;
  promoItem: string | null;
}) {
  const voucherType = String(args.voucherType || "").trim().toUpperCase();
  const value = toNumber(args.voucherValue);
  const finalPrice = Math.max(0, toNumber(args.memberPrice));

  if (voucherType === "A") {
    const percent = value > 0 ? value : 0;
    const originalPrice = percent > 0 && percent < 100 ? finalPrice / (1 - percent / 100) : finalPrice;
    return {
      originalPrice,
      discount: Math.max(0, originalPrice - finalPrice),
      finalPrice,
    };
  }

  if (voucherType === "B") {
    const originalPrice = finalPrice + Math.max(0, value);
    return {
      originalPrice,
      discount: Math.max(0, value),
      finalPrice,
    };
  }

  if (voucherType === "C") {
    const originalPrice = finalPrice;
    return {
      originalPrice,
      discount: originalPrice,
      finalPrice,
    };
  }

  return {
    originalPrice: finalPrice,
    discount: 0,
    finalPrice,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MemberPurchaseHistoryResponse>
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
      },
    });

    if (!member || member.user_type !== "member") {
      return res.status(403).json({ error: "Current user is not a member" });
    }

    const purchases = await prisma.$queryRaw<
      Array<{
        purchase_id: number;
        voucher_id: string | null;
        purchase_date: Date | null;
        status: string | null;
        voucher_type: string | null;
        voucher_value: unknown;
        member_price: unknown;
        promo_item: string | null;
        provider_name: string | null;
      }>
    >`
      SELECT
        p.purchase_id,
        p.voucher_id,
        p.purchase_date,
        p.status,
        v.type AS voucher_type,
        v.value AS voucher_value,
        v.member_price,
        v.promo_item,
        pp.business_name AS provider_name
      FROM purchases p
      LEFT JOIN vouchers v
        ON v.voucher_id = p.voucher_id
      LEFT JOIN provider_profiles pp
        ON pp.user_id = v.provider_id
      WHERE p.member_id = ${member.user_id}::uuid
      ORDER BY p.purchase_date DESC NULLS LAST, p.purchase_id DESC;
    `;

    const formattedPurchases: MemberPurchaseRecord[] = purchases.map((purchase) => {
      const providerName = purchase.provider_name || "Provider";
      const amounts = calculatePurchaseAmounts({
        voucherType: purchase.voucher_type,
        voucherValue: purchase.voucher_value,
        memberPrice: purchase.member_price,
        promoItem: purchase.promo_item,
      });

      return {
        id: `PH-${purchase.purchase_id}`,
        voucherId: purchase.voucher_id || "",
        title: formatPurchaseTitle({
          providerName,
          voucherType: purchase.voucher_type,
          voucherValue: purchase.voucher_value,
          promoItem: purchase.promo_item,
        }),
        provider: providerName,
        originalPrice: Number(amounts.originalPrice.toFixed(2)),
        discount: Number(amounts.discount.toFixed(2)),
        finalPrice: Number(amounts.finalPrice.toFixed(2)),
        date: purchase.purchase_date ? purchase.purchase_date.toISOString() : "",
        status: String(purchase.status || "completed").toLowerCase() === "refunded" ? "refunded" : "completed",
      };
    });

    return res.status(200).json({
      member: {
        id: member.user_id,
        displayId: member.display_id ?? null,
      },
      purchases: formattedPurchases,
    });
  } catch (error) {
    console.error("member-purchase-history error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch member purchase history",
    });
  }
}
