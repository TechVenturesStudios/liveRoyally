export type AdminPromoCode = {
  promoCodeId: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  deactivatedAt: string | null;
  redemptionCount: number;
  activeTrialCount: number;
};

async function readJson(response: Response, fallbackError: string) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || fallbackError);
  }
  return data;
}

export async function fetchAdminPromoCodes() {
  const data = await readJson(await fetch("/api/admin/promo-codes"), "Failed to load promo codes");
  return (Array.isArray(data.promoCodes) ? data.promoCodes : []) as AdminPromoCode[];
}

export async function createAdminPromoCode(input: { code: string; description?: string }) {
  const data = await readJson(
    await fetch("/api/admin/promo-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
    "Failed to create promo code"
  );
  return data.promoCode as AdminPromoCode;
}

export async function setAdminPromoCodeActive(promoCodeId: string, isActive: boolean) {
  const data = await readJson(
    await fetch(`/api/admin/promo-codes/${encodeURIComponent(promoCodeId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    }),
    "Failed to update promo code"
  );
  return data.promoCode as AdminPromoCode;
}

export async function validatePromoCode(code: string) {
  const response = await fetch("/api/validate-promo-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Unable to validate promo code");
  }
  return data as { valid: true; code: string; trialMonths: number } | { valid: false; error: string };
}

export async function activatePartnerSubscription(input: {
  plan: string;
  paymentToken: string;
  checkoutKey: string;
}) {
  const data = await readJson(
    await fetch("/api/partner-subscription-activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
    "Unable to start your subscription"
  );
  return data as { message: string; plan: string; currentPeriodEnd: string | null };
}
