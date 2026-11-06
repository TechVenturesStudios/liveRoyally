import type { NextApiRequest, NextApiResponse } from "next";
import { findActivePromoCode, PROMO_TRIAL_MONTHS } from "../../lib/promo-codes";

type ValidatePromoCodeResponse =
  | { valid: true; code: string; trialMonths: number }
  | { valid: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ValidatePromoCodeResponse>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ valid: false, error: "Method not allowed" });
  }

  try {
    const promo = await findActivePromoCode(req.body?.code);
    if (!promo) {
      return res.status(200).json({ valid: false, error: "This promo code is invalid or no longer active." });
    }

    return res.status(200).json({ valid: true, code: promo.code, trialMonths: PROMO_TRIAL_MONTHS });
  } catch (error) {
    console.error("validate-promo-code error:", error);
    return res.status(500).json({ valid: false, error: "Unable to validate promo code" });
  }
}
