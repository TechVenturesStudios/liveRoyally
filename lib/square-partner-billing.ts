import { createHash } from "crypto";
import { PartnerSubscriptionPlan, PartnerSubscriptionStatus } from "@prisma/client";

const squareApiVersion = process.env.SQUARE_VERSION ?? "2026-07-15";
const squareEnvironment = (process.env.SQUARE_ENVIRONMENT ?? "sandbox").toLowerCase();
const rawSquareAccessToken = process.env.SQUARE_ACCESS_TOKEN;
const squareAccessToken = rawSquareAccessToken?.replace(/\s+/g, "");
const squareLocationId = String(process.env.SQUARE_LOCATION_ID || "").trim();
const squareBaseUrl =
  squareEnvironment === "production" || squareEnvironment === "prod"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";

const squarePlanVariationIds: Record<PartnerSubscriptionPlan, string | undefined> = {
  spotlight: process.env.SQUARE_PLAN_VARIATION_SPOTLIGHT_ID,
  standard: process.env.SQUARE_PLAN_VARIATION_STANDARD_ID,
  premium: process.env.SQUARE_PLAN_VARIATION_PREMIUM_ID,
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
    current_period_start?: string;
    current_period_end?: string;
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

async function squareRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  if (!squareAccessToken) {
    throw new Error("Missing env var SQUARE_ACCESS_TOKEN");
  }

  const response = await fetch(`${squareBaseUrl}${path}`, {
    method: "POST",
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

export function getSquarePlanVariationId(plan: PartnerSubscriptionPlan) {
  return squarePlanVariationIds[plan];
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
    note: "Live Royally partner registration",
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

  const payload = await squareRequest<SquareCardResponse>("/v2/cards", {
    idempotency_key: squareIdempotencyKey("lr-card", params.referenceId),
    source_id: params.paymentToken,
    card: {
      customer_id: params.customerId,
      cardholder_name: params.cardholderName,
      reference_id: params.referenceId,
      ...(addressLine1 && locality && region && postalCode
        ? {
            billing_address: {
              address_line_1: addressLine1,
              locality,
              administrative_district_level_1: region,
              postal_code: postalCode,
              country: "US",
            },
          }
        : {}),
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
  });

  const subscription = payload.subscription;

  if (!subscription?.id) {
    throw new Error("Square did not return a subscription ID");
  }

  return subscription;
}

export async function disableSquareCard(cardId: string) {
  await squareRequest<{ card?: { id?: string } }>(`/v2/cards/${encodeURIComponent(cardId)}/disable`, {});
}

export function normalizeSquareStatus(status?: string | null) {
  switch ((status ?? "").toUpperCase()) {
    case "ACTIVE":
      return PartnerSubscriptionStatus.active;
    case "PENDING":
      return PartnerSubscriptionStatus.pending;
    case "PAST_DUE":
      return PartnerSubscriptionStatus.past_due;
    case "CANCELED":
      return PartnerSubscriptionStatus.canceled;
    case "EXPIRED":
      return PartnerSubscriptionStatus.expired;
    default:
      return PartnerSubscriptionStatus.pending;
  }
}
