import { createHash } from "crypto";
import { PartnerSubscriptionStatus } from "@prisma/client";
import { PARTNER_SUBSCRIPTION_PLANS, type PartnerSubscriptionPlan } from "../src/config/subscriptionPlans";

const squareApiVersion = process.env.SQUARE_VERSION ?? "2026-07-15";
const squareEnvironment = (process.env.SQUARE_ENVIRONMENT ?? "sandbox").toLowerCase();
const rawSquareAccessToken = process.env.SQUARE_ACCESS_TOKEN;
const squareAccessToken = rawSquareAccessToken?.replace(/\s+/g, "");
const squareLocationId = String(process.env.SQUARE_LOCATION_ID || "").trim();
const squareBaseUrl =
  squareEnvironment === "production" || squareEnvironment === "prod"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";

function readFirstEnv(...keys: Array<string | undefined>) {
  for (const key of keys) {
    if (!key) continue;

    const value = String(process.env[key] || "").trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

const squarePlanVariationIds: Record<PartnerSubscriptionPlan, string | undefined> = {
  starter: readFirstEnv(
    PARTNER_SUBSCRIPTION_PLANS.starter.squarePlanVariationEnvVar,
    "SQUARE_PLAN_VARIATION_STARTER_ID"
  ),
  spotlight: readFirstEnv(
    PARTNER_SUBSCRIPTION_PLANS.spotlight.squarePlanVariationEnvVar,
    "SQUARE_PLAN_VARIATION_SPOTLIGHT_ID"
  ),
  standard: readFirstEnv(
    PARTNER_SUBSCRIPTION_PLANS.standard.squarePlanVariationEnvVar,
    "SQUARE_PLAN_VARIATION_STANDARD_ID"
  ),
  premium: readFirstEnv(
    PARTNER_SUBSCRIPTION_PLANS.premium.squarePlanVariationEnvVar,
    "SQUARE_PLAN_VARIATION_PREMIUM_ID"
  ),
  enterprise: readFirstEnv(
    PARTNER_SUBSCRIPTION_PLANS.enterprise.squarePlanVariationEnvVar,
    "SQUARE_PLAN_VARIATION_ENTERPRISE_ID"
  ),
};

type SquareCustomerResponse = {
  customer?: {
    id?: string;
  };
  errors?: Array<{
    category?: string;
    code?: string;
    detail?: string;
  }>;
};

type SquareCardResponse = {
  card?: {
    id?: string;
  };
  errors?: Array<{
    category?: string;
    code?: string;
    detail?: string;
  }>;
};

type SquareSubscriptionResponse = {
  subscription?: {
    id?: string;
    customer_id?: string;
    location_id?: string;
    plan_variation_id?: string;
    status?: string;
    start_date?: string;
    created_at?: string;
    charged_through_date?: string;
    canceled_date?: string;
    card_id?: string;
  };
  errors?: Array<{
    category?: string;
    code?: string;
    detail?: string;
  }>;
};

function squareErrorMessage(
  payload: { errors?: Array<{ category?: string; code?: string; detail?: string }> } | null
) {
  return payload?.errors?.length
    ? payload.errors
        .map((error) => `${error.category ?? "Error"}: ${error.detail ?? error.code ?? "Unknown"}`)
        .join("; ")
    : "Unknown Square error";
}

async function squareRequest<T>(
  path: string,
  body: Record<string, unknown>,
  method: "POST" | "PUT" = "POST"
): Promise<T> {
  if (!squareAccessToken) {
    throw new Error("Missing env var SQUARE_ACCESS_TOKEN");
  }

  const response = await fetch(`${squareBaseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${squareAccessToken}`,
      "Content-Type": "application/json",
      "Square-Version": squareApiVersion,
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as (T & { errors?: unknown }) | null;

  if (!response.ok) {
    throw new Error(
      `Square request failed for ${path}: ${squareErrorMessage(
        payload as { errors?: Array<{ category?: string; code?: string; detail?: string }> } | null
      )}`
    );
  }

  return payload as T;
}

function stableIdempotencyKey(seed: string) {
  return createHash("sha256").update(seed).digest("hex").slice(0, 32);
}

export function squareIdempotencyKey(prefix: string, seed: string) {
  const hash = stableIdempotencyKey(seed);
  const allowedHashLength = Math.max(1, 45 - prefix.length - 1);
  return `${prefix}-${hash.slice(0, allowedHashLength)}`;
}

export async function createSquarePayment(params: {
  accessToken: string;
  locationId: string;
  sourceId: string;
  amountCents: number;
  referenceId: string;
  buyerEmail?: string | null;
  note?: string | null;
}) {
  if (!params.accessToken.trim()) {
    throw new Error("Missing Square partner access token");
  }

  if (!params.locationId.trim()) {
    throw new Error("The partner's Square location is not configured");
  }

  if (!Number.isInteger(params.amountCents) || params.amountCents <= 0) {
    throw new Error("Payment amount must be a positive whole number of cents");
  }

  const response = await fetch(`${squareBaseUrl}/v2/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken.trim()}`,
      "Content-Type": "application/json",
      "Square-Version": squareApiVersion,
    },
    body: JSON.stringify({
      source_id: params.sourceId,
      idempotency_key: squareIdempotencyKey("lr-voucher", params.referenceId),
      amount_money: { amount: params.amountCents, currency: "USD" },
      location_id: params.locationId.trim(),
      autocomplete: true,
      buyer_email_address: params.buyerEmail?.trim() || undefined,
      note: params.note?.trim() || undefined,
    }),
  });

  const payload = await response.json().catch(() => null) as {
    payment?: { id?: string; status?: string };
    errors?: Array<{ category?: string; code?: string; detail?: string }>;
  } | null;

  if (!response.ok) {
    throw new Error(
      `Square payment failed: ${payload?.errors?.map((error) => error.detail || error.code || "Unknown error").join("; ") || "Unknown error"}`
    );
  }

  if (!payload?.payment?.id || String(payload.payment.status || "").toUpperCase() !== "COMPLETED") {
    throw new Error("Square did not complete the voucher payment");
  }

  return payload.payment;
}

export function getSquarePlanVariationId(plan: PartnerSubscriptionPlan) {
  return squarePlanVariationIds[plan];
}

export const LIVE_ROYALLY_PROVIDER_ANNUAL_PRICE_CENTS = 10000;

export function getLiveRoyallyProviderPlanVariationId() {
  return readFirstEnv(
    "SQUARE_PLAN_VARIATION_LIVE_ROYALLY_PROVIDER_ANNUAL_ID",
    "SQUARE_PLAN_VARIATION_LIVE_ROYALLY_ANNUAL_ID",
    "SQUARE_PLAN_VARIATION_STARTER_ANNUAL_ID",
    "SQUARE_PLAN_VARIATION_STARTER_ID"
  );
}

export async function createSquareCustomer(params: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  organizationName?: string | null;
  organizationPhone?: string | null;
  organizationAddress?: string | null;
  organizationCity?: string | null;
  organizationState?: string | null;
  organizationZip?: string | null;
  referenceId: string;
}) {
  const addressLine1 = params.organizationAddress?.trim();
  const locality = params.organizationCity?.trim();
  const region = params.organizationState?.trim();
  const postalCode = params.organizationZip?.trim();

  const payload = await squareRequest<SquareCustomerResponse>("/v2/customers", {
    idempotency_key: squareIdempotencyKey("lr-customer", params.referenceId),
    given_name: params.firstName?.trim() || undefined,
    family_name: params.lastName?.trim() || undefined,
    company_name: params.organizationName?.trim() || undefined,
    email_address: params.email.trim().toLowerCase(),
    phone_number: params.organizationPhone?.trim() || undefined,
    reference_id: params.referenceId,
    note: "Local Metrics  partner registration",
    ...(addressLine1 && locality && region && postalCode
      ? {
          address: {
            address_line_1: addressLine1,
            locality,
            administrative_district_level_1: region,
            postal_code: postalCode,
            country: "US",
          },
        }
      : {}),
  });

  const customerId = payload.customer?.id;

  if (!customerId) {
    throw new Error("Square did not return a customer ID");
  }

  return customerId;
}

export async function createSquareCard(params: {
  paymentToken: string;
  customerId: string;
  cardholderName: string;
  referenceId: string;
}) {
  const payload = await squareRequest<SquareCardResponse>("/v2/cards", {
    idempotency_key: squareIdempotencyKey("lr-card", params.referenceId),
    source_id: params.paymentToken,
    card: {
      customer_id: params.customerId,
      cardholder_name: params.cardholderName,
      reference_id: params.referenceId,
    },
  });

  const cardId = payload.card?.id;

  if (!cardId) {
    throw new Error("Square did not return a card ID");
  }

  return cardId;
}

export async function createSquareSubscription(params: {
  customerId: string;
  cardId: string;
  planVariationId: string;
  referenceId: string;
  startDate?: string;
  priceOverrideCents?: number;
}) {
  if (!squareLocationId) {
    throw new Error("Missing env var SQUARE_LOCATION_ID");
  }

  const payload = await squareRequest<SquareSubscriptionResponse>("/v2/subscriptions", {
    idempotency_key: squareIdempotencyKey("lr-subscription", params.referenceId),
    customer_id: params.customerId,
    location_id: squareLocationId,
    plan_variation_id: params.planVariationId,
    card_id: params.cardId,
    ...(params.startDate ? { start_date: params.startDate } : {}),
    ...(typeof params.priceOverrideCents === "number"
      ? { price_override_money: { amount: params.priceOverrideCents, currency: "USD" } }
      : {}),
  });

  const subscription = payload.subscription;

  if (!subscription?.id) {
    throw new Error("Square did not return a subscription ID");
  }

  return subscription;
}

export async function setSquareSubscriptionCanceledDate(params: {
  subscriptionId: string;
  canceledDate: string;
  referenceId: string;
}) {
  const payload = await squareRequest<SquareSubscriptionResponse>(
    `/v2/subscriptions/${encodeURIComponent(params.subscriptionId)}`,
    {
      subscription: { canceled_date: params.canceledDate },
    },
    "PUT"
  );

  return payload.subscription;
}

export async function cancelSquareSubscription(subscriptionId: string) {
  const payload = await squareRequest<SquareSubscriptionResponse>(
    `/v2/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
    {}
  );

  return payload.subscription;
}

export async function swapSquareSubscriptionPlan(params: {
  subscriptionId: string;
  planVariationId: string;
  referenceId: string;
}) {
  const payload = await squareRequest<SquareSubscriptionResponse>(
    `/v2/subscriptions/${encodeURIComponent(params.subscriptionId)}/swap-plan`,
    {
      idempotency_key: squareIdempotencyKey("lr-swap", params.referenceId),
      new_plan_variation_id: params.planVariationId,
    }
  );

  return payload.subscription;
}

export async function disableSquareCard(cardId: string) {
  await squareRequest<{ card?: { id?: string } }>(`/v2/cards/${encodeURIComponent(cardId)}/disable`, {});
}

/**
 * Maps Square's subscription status to ours. Square deactivates a subscription
 * when billing fails, so DEACTIVATED and PAUSED both mean the partner is no
 * longer paid up. COMPLETED means a plan with a fixed number of billing
 * periods ran out; our auto-renewing plans never reach it.
 */
export function normalizeSquareStatus(status?: string | null) {
  switch ((status ?? "").toUpperCase()) {
    case "ACTIVE":
      return PartnerSubscriptionStatus.active;
    case "PENDING":
      return PartnerSubscriptionStatus.pending;
    case "CANCELED":
      return PartnerSubscriptionStatus.canceled;
    case "DEACTIVATED":
    case "PAUSED":
      return PartnerSubscriptionStatus.past_due;
    case "COMPLETED":
      return PartnerSubscriptionStatus.expired;
    default:
      return PartnerSubscriptionStatus.pending;
  }
}

/** Parses a Square YYYY-MM-DD date as UTC midnight. */
function parseSquareDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addYears(date: Date, years: number) {
  const result = new Date(date);
  result.setUTCFullYear(result.getUTCFullYear() + years);
  return result;
}

/**
 * Square has no current-period fields on a subscription; `charged_through_date`
 * is the date the subscriber has been invoiced through. Every Square plan we
 * sell bills annually, so the current period is the year ending on that date.
 * Returns null when Square has not invoiced the subscription yet.
 */
export function squarePeriodFromChargedThrough(chargedThroughDate?: string | null) {
  const end = parseSquareDate(chargedThroughDate);
  return end ? { start: addYears(end, -1), end } : null;
}

/**
 * Billing period for a subscription that was just created. Square usually has
 * not set `charged_through_date` yet, so fall back to one year from the start
 * date; the `subscription.updated` webhook corrects it once Square invoices.
 */
export function squareInitialPeriod(
  subscription: { start_date?: string | null; charged_through_date?: string | null },
  fallbackStart: Date
) {
  const charged = squarePeriodFromChargedThrough(subscription.charged_through_date);
  if (charged) return charged;
  const start = parseSquareDate(subscription.start_date) ?? fallbackStart;
  return { start, end: addYears(start, 1) };
}
