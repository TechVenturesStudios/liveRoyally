import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";

import { resolveDashboardAccount } from "../../../lib/dashboard-account";
import { prisma } from "../../../lib/prisma";
import {
  expireEndedPartnerTrials,
  isValidPromoCodeFormat,
  normalizePromoCode,
  promoCodeSelect,
  toAdminPromoCode,
  type AdminPromoCode,
} from "../../../lib/promo-codes";

type ResponseBody = { promoCodes: AdminPromoCode[] } | { promoCode: AdminPromoCode } | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseBody>) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET,POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const account = await resolveDashboardAccount(req, ["admin"]);
    if (!account) return res.status(500).json({ error: "Unable to resolve admin account" });
    if ("error" in account) return res.status(account.status).json({ error: account.error });

    if (req.method === "GET") {
      await expireEndedPartnerTrials();
      const rows = await prisma.promo_codes.findMany({
        orderBy: [{ is_active: "desc" }, { created_at: "desc" }],
        select: promoCodeSelect,
      });
      return res.status(200).json({ promoCodes: rows.map(toAdminPromoCode) });
    }

    const code = normalizePromoCode(req.body?.code);
    if (!isValidPromoCodeFormat(code)) {
      return res.status(400).json({
        error: "Promo codes must be 3-50 characters using letters, numbers, dashes, or underscores.",
      });
    }

    const description = String(req.body?.description ?? "").trim().slice(0, 255) || null;

    try {
      const row = await prisma.promo_codes.create({
        data: { code, description, created_by: account.requestUserId },
        select: promoCodeSelect,
      });
      return res.status(201).json({ promoCode: toAdminPromoCode(row) });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return res.status(409).json({ error: `Promo code ${code} already exists.` });
      }
      throw error;
    }
  } catch (error) {
    console.error("admin promo-codes error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to manage promo codes" });
  }
}
