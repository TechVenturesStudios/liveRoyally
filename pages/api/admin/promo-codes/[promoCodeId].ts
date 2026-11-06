import type { NextApiRequest, NextApiResponse } from "next";

import { resolveDashboardAccount } from "../../../../lib/dashboard-account";
import { prisma } from "../../../../lib/prisma";
import { promoCodeSelect, toAdminPromoCode, type AdminPromoCode } from "../../../../lib/promo-codes";

type ResponseBody = { promoCode: AdminPromoCode } | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseBody>) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const account = await resolveDashboardAccount(req, ["admin"]);
    if (!account) return res.status(500).json({ error: "Unable to resolve admin account" });
    if ("error" in account) return res.status(account.status).json({ error: account.error });

    const promoCodeId = String(req.query.promoCodeId || "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(promoCodeId)) {
      return res.status(400).json({ error: "Invalid promo code id" });
    }
    if (typeof req.body?.isActive !== "boolean") {
      return res.status(400).json({ error: "isActive must be true or false" });
    }
    const isActive = req.body.isActive as boolean;

    const existing = await prisma.promo_codes.findUnique({
      where: { promo_code_id: promoCodeId },
      select: { promo_code_id: true },
    });
    if (!existing) return res.status(404).json({ error: "Promo code not found" });

    // Deactivating only stops new redemptions; trials already granted keep running.
    const now = new Date();
    const row = await prisma.promo_codes.update({
      where: { promo_code_id: promoCodeId },
      data: { is_active: isActive, deactivated_at: isActive ? null : now, updated_at: now },
      select: promoCodeSelect,
    });

    return res.status(200).json({ promoCode: toAdminPromoCode(row) });
  } catch (error) {
    console.error("admin promo-code update error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update promo code" });
  }
}
