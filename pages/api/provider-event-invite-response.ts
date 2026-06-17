import type { NextApiRequest, NextApiResponse } from "next";
import { randomBytes } from "crypto";
import { prisma } from "../../lib/prisma";
import { resolveDashboardAccount } from "../../lib/dashboard-account";

type ProviderInviteResponse =
  | {
      invite: {
        invite_id: string;
        status: string;
        responded_at: Date | null;
        voucher_id: string | null;
      };
      voucher?: {
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
      alreadyApproved?: boolean;
    }
  | {
      error: string;
    };

type UiVoucherType = "N" | "P" | "A" | "F";
type DbVoucherType = "A" | "B" | "C";

const uiToDbType: Record<Exclude<UiVoucherType, "N">, DbVoucherType> = {
  P: "A",
  A: "B",
  F: "C",
};

function setCorsHeaders(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");
}

function hasValue(value: unknown) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function parseVoucherType(value: unknown) {
  const type = String(value ?? "N").trim().toUpperCase();
  if (!["N", "P", "A", "F"].includes(type)) {
    throw new Error("Invalid voucher type. Use N, P, A, or F.");
  }
  return type as UiVoucherType;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProviderInviteResponse>
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

    const body = req.body ?? {};
    const inviteId = String(body.inviteId ?? "").trim();
    const action = String(body.action ?? "").trim().toLowerCase();

    if (!inviteId || !["approve", "decline"].includes(action)) {
      return res.status(400).json({ error: "inviteId and action are required" });
    }

    const invite = await prisma.event_provider_invites.findFirst({
      where: {
        invite_id: inviteId,
        provider_id: account.actingUserId,
      },
      select: {
        invite_id: true,
        event_id: true,
        provider_id: true,
        status: true,
        voucher_id: true,
      },
    });

    if (!invite) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    if (action === "decline") {
      const declinedInvite = await prisma.event_provider_invites.update({
        where: { invite_id: invite.invite_id },
        data: {
          status: "declined",
          responded_at: new Date(),
        },
        select: {
          invite_id: true,
          status: true,
          responded_at: true,
          voucher_id: true,
        },
      });

      return res.status(200).json({ invite: declinedInvite });
    }

    const uiType = parseVoucherType(body.voucher?.type);
    const expirationDate = body.voucher?.expirationDate
      ? new Date(String(body.voucher.expirationDate))
      : null;

    if (expirationDate && Number.isNaN(expirationDate.getTime())) {
      return res.status(400).json({ error: "expirationDate must be a valid date" });
    }

    const hasDiscount = uiType !== "N";

    if (hasDiscount && !["P", "A", "F"].includes(uiType)) {
      return res.status(400).json({ error: "Invalid voucher type. Use N, P, A, or F." });
    }

    if (hasDiscount && hasValue(body.voucher?.memberPrice)) {
      return res.status(400).json({
        error: "memberPrice should only be entered when no discount is selected",
      });
    }

    if (!hasDiscount && !hasValue(body.voucher?.memberPrice)) {
      return res.status(400).json({
        error: "memberPrice is required when no discount is selected",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingVoucher = invite.voucher_id
        ? await tx.vouchers.findUnique({
            where: { voucher_id: invite.voucher_id },
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
          })
        : await tx.vouchers.findFirst({
            where: {
              event_id: invite.event_id,
              provider_id: invite.provider_id,
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
        const updatedInvite = await tx.event_provider_invites.update({
          where: { invite_id: invite.invite_id },
          data: {
            status: "accepted",
            responded_at: new Date(),
            voucher_id: existingVoucher.voucher_id,
          },
          select: {
            invite_id: true,
            status: true,
            responded_at: true,
            voucher_id: true,
          },
        });

        return {
          invite: updatedInvite,
          voucher: existingVoucher,
          alreadyApproved: true,
        };
      }

      let value = 0;
      let promoItem: string | null = null;
      let memberPrice: number | null = null;
      let maxRedemptions: number | null = null;

      if (hasValue(body.voucher?.maxRedemptions)) {
        const parsedMaxRedemptions = Number(body.voucher?.maxRedemptions);
        if (!Number.isInteger(parsedMaxRedemptions) || parsedMaxRedemptions <= 0) {
          throw new Error("maxRedemptions must be a positive whole number");
        }
        maxRedemptions = parsedMaxRedemptions;
      }

      if (!hasDiscount) {
        const parsedMemberPrice = Number(body.voucher?.memberPrice);
        if (!Number.isFinite(parsedMemberPrice) || parsedMemberPrice < 0) {
          throw new Error("memberPrice is required when no discount is selected");
        }
        memberPrice = parsedMemberPrice;
      }

      if (uiType === "P") {
        const percent = Number(body.voucher?.value);
        if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
          throw new Error("Percent discount must be between 1 and 100");
        }
        value = percent;
      }

      if (uiType === "A") {
        const amount = Number(body.voucher?.value);
        if (!Number.isFinite(amount) || amount <= 0) {
          throw new Error("Amount discount must be greater than 0");
        }
        value = amount;
      }

      if (uiType === "F") {
        const rawPromoItem =
          typeof body.voucher?.promoItem === "string" ? body.voucher.promoItem.trim() : "";
        if (!rawPromoItem) {
          throw new Error("promoItem is required for free-item vouchers");
        }
        promoItem = rawPromoItem;
      }

      const voucher = await tx.vouchers.create({
        data: {
          voucher_id: `V-${Date.now()}-${randomBytes(3).toString("hex")}`,
          event_id: invite.event_id,
          provider_id: invite.provider_id,
          type: hasDiscount ? uiToDbType[uiType as Exclude<UiVoucherType, "N">] : null,
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

      const updatedInvite = await tx.event_provider_invites.update({
        where: { invite_id: invite.invite_id },
        data: {
          status: "accepted",
          responded_at: new Date(),
          voucher_id: voucher.voucher_id,
        },
        select: {
          invite_id: true,
          status: true,
          responded_at: true,
          voucher_id: true,
        },
      });

      return {
        invite: updatedInvite,
        voucher,
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("provider-event-invite-response error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update invitation",
    });
  }
}
