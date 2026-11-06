import { PartnerSubscriptionStatus, type Prisma } from "@prisma/client";
import { prisma } from "./prisma";

/** Length of the free trial granted by any active promo code. */
export const PROMO_TRIAL_MONTHS = 6;

/** The free Starter plan is limited to one year, then a paid tier is required. */
export const STARTER_FREE_TERM_MONTHS = 12;

export function normalizePromoCode(value: unknown) {
  return String(value ?? "").trim().toUpperCase();
}

export function isValidPromoCodeFormat(code: string) {
  return /^[A-Z0-9_-]{3,50}$/.test(code);
}

/** Returns the promo code row only when it exists and is currently active. */
export async function findActivePromoCode(value: unknown) {
  const code = normalizePromoCode(value);
  if (!code) return null;

  return prisma.promo_codes.findFirst({
    where: { code, is_active: true },
    select: { promo_code_id: true, code: true, description: true },
  });
}

export function addMonths(date: Date, months: number) {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCMonth(result.getUTCMonth() + months);
  // Clamp end-of-month overflow (e.g. Aug 31 + 6 months -> Feb 28, not Mar 3).
  if (result.getUTCDate() < day) result.setUTCDate(0);
  return result;
}

/**
 * Free terms (promo trials and the one-year Starter plan) never auto-renew:
 * once trial_ends_at passes on a term that
 * was never converted to a paid Square subscription, the subscription is
 * expired. Existing access checks treat any non-active status as locked.
 */
export async function expireEndedPartnerTrials(partnerId?: string) {
  const now = new Date();
  return prisma.partner_subscriptions.updateMany({
    where: {
      ...(partnerId ? { partner_id: partnerId } : {}),
      status: PartnerSubscriptionStatus.active,
      billing_provider_subscription_id: null,
      trial_ends_at: { lte: now },
    },
    data: {
      status: PartnerSubscriptionStatus.expired,
      updated_at: now,
    },
  });
}

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

export const promoCodeSelect = {
  promo_code_id: true,
  code: true,
  description: true,
  is_active: true,
  created_at: true,
  deactivated_at: true,
  partner_subscriptions: {
    select: { status: true, billing_provider_subscription_id: true, trial_ends_at: true },
  },
} satisfies Prisma.promo_codesSelect;

type PromoCodeRow = Prisma.promo_codesGetPayload<{ select: typeof promoCodeSelect }>;

export function toAdminPromoCode(row: PromoCodeRow): AdminPromoCode {
  const now = Date.now();
  return {
    promoCodeId: row.promo_code_id,
    code: row.code,
    description: row.description,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    deactivatedAt: row.deactivated_at?.toISOString() ?? null,
    redemptionCount: row.partner_subscriptions.length,
    activeTrialCount: row.partner_subscriptions.filter(
      (subscription) =>
        subscription.status === "active" &&
        !subscription.billing_provider_subscription_id &&
        subscription.trial_ends_at &&
        subscription.trial_ends_at.getTime() > now
    ).length,
  };
}
