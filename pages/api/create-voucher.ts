import type { NextApiRequest, NextApiResponse } from "next";
import { randomBytes } from "crypto";
import { prisma } from "../../lib/prisma";

type UiVoucherType = "P" | "A" | "F";
type DbVoucherType = "A" | "B" | "C";

type CreateVoucherResponse =
  | {
      voucher: {
        voucher_id: string;
        event_id: string | null;
        provider_id: string | null;
        type: string | null;
        value: unknown;
        expiration_date: Date | null;
        status: string | null;
        promo_item: string | null;
        member_price: number | null;
        max_redemptions: number | null;
        created_at: Date | null;
      };
      alreadySignedUp: boolean;
    }
  | {
      error: string;
    };

const uiToDbType: Record<UiVoucherType, DbVoucherType> = {
  P: "A",
  A: "B",
  F: "C",
};

function setCorsHeaders(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");
}

function isUiVoucherType(type: string): type is UiVoucherType {
  return ["P", "A", "F"].includes(type);
}

function hasValue(value: unknown) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateVoucherResponse>
) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body ?? {};
    const eventId = String(body.eventId ?? "").trim();
    const providerId = String(body.providerId ?? "").trim();
    const uiType = String(body.type ?? "N").trim().toUpperCase();
    const expirationDate = body.expirationDate ? new Date(String(body.expirationDate)) : null;
    const hasDiscount = uiType !== "N";

    if (!eventId || !providerId) {
      return res.status(400).json({ error: "Missing eventId, providerId, or type" });
    }

    if (hasDiscount && !isUiVoucherType(uiType)) {
      return res.status(400).json({ error: "Invalid voucher type. Use N, P, A, or F." });
    }

    if (expirationDate && Number.isNaN(expirationDate.getTime())) {
      return res.status(400).json({ error: "expirationDate must be a valid date" });
    }

    let value = 0;
    let promoItem: string | null = null;
    let memberPrice: number | null = null;
    let maxRedemptions: number | null = null;

    if (hasValue(body.maxRedemptions)) {
      const parsedMaxRedemptions = Number(body.maxRedemptions);
      if (!Number.isInteger(parsedMaxRedemptions) || parsedMaxRedemptions <= 0) {
        return res.status(400).json({ error: "maxRedemptions must be a positive whole number" });
      }
      maxRedemptions = parsedMaxRedemptions;
    }

    if (hasDiscount && hasValue(body.memberPrice)) {
      return res.status(400).json({
        error: "memberPrice should only be entered when no discount is selected",
      });
    }

    if (!hasDiscount) {
      const parsedMemberPrice = Number(body.memberPrice);
      if (!Number.isFinite(parsedMemberPrice) || parsedMemberPrice < 0) {
        return res.status(400).json({
          error: "memberPrice is required when no discount is selected",
        });
      }
      memberPrice = parsedMemberPrice;
    }

    if (uiType === "P") {
      const percent = Number(body.value);
      if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
        return res.status(400).json({ error: "Percent discount must be between 1 and 100" });
      }
      value = percent;
    }

    if (uiType === "A") {
      const amount = Number(body.value);
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: "Amount discount must be greater than 0" });
      }
      value = amount;
    }

    if (uiType === "F") {
      const rawPromoItem = typeof body.promoItem === "string" ? body.promoItem.trim() : "";
      if (!rawPromoItem) {
        return res.status(400).json({ error: "promoItem is required for free-item vouchers" });
      }
      promoItem = rawPromoItem;
    }

    const existingVoucher = await prisma.vouchers.findFirst({
      where: {
        event_id: eventId,
        provider_id: providerId,
      },
      orderBy: { created_at: "desc" },
      select: {
        voucher_id: true,
        event_id: true,
        provider_id: true,
        type: true,
        value: true,
        expiration_date: true,
        status: true,
        promo_item: true,
        member_price: true,
        max_redemptions: true,
        created_at: true,
      },
    });

    if (existingVoucher) {
      return res.status(200).json({
        voucher: existingVoucher,
        alreadySignedUp: true,
      });
    }

    const voucher = await prisma.vouchers.create({
      data: {
        voucher_id: `V-${Date.now()}-${randomBytes(3).toString("hex")}`,
        event_id: eventId,
        provider_id: providerId,
        type: hasDiscount ? uiToDbType[uiType] : null,
        value,
        expiration_date: expirationDate,
        status: "active",
        promo_item: promoItem,
        member_price: memberPrice,
        max_redemptions: maxRedemptions,
      },
      select: {
        voucher_id: true,
        event_id: true,
        provider_id: true,
        type: true,
        value: true,
        expiration_date: true,
        status: true,
        promo_item: true,
        member_price: true,
        max_redemptions: true,
        created_at: true,
      },
    });

    return res.status(200).json({ voucher, alreadySignedUp: false });
  } catch (error) {
    console.error("createVoucher error:", error);
    return res.status(500).json({ error: "Failed to create voucher" });
  }
}
