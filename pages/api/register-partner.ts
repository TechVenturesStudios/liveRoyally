import type { NextApiRequest, NextApiResponse } from "next";
import { createHash, randomInt } from "crypto";
import {
  BillingProvider,
  PartnerSubscriptionPlan,
  PartnerSubscriptionStatus,
  UserType,
} from "@prisma/client";

import { createOrGetCognitoUser } from "../../lib/cognito-admin";
import { prisma } from "../../lib/prisma";
import { getOrCreateRole } from "../../lib/roles";
import { PARTNER_SUBSCRIPTION_PLANS } from "../../src/config/subscriptionPlans";

type RegisterPartnerResponse =
  | {
      message: string;
      userId: string;
      displayId: string;
      partnerCode: string;
      subscriptionId: string;
      squareCustomerId: string;
      squareCardId: string;
      squareSubscriptionId: string;
    }
  | {
      error: string;
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

const addOneMonth = (date: Date) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
};

const optionalString = (value: unknown) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return String(value);
};

const normalizeZip = (value: unknown) => String(value || "").replace(/\D/g, "").slice(0, 5);

const normalizeCardholderName = (firstName: unknown, lastName: unknown, organizationName: unknown) => {
  const name = `${String(firstName || "").trim()} ${String(lastName || "").trim()}`.trim();

  if (name) {
    return name;
  }

  return String(organizationName || "").trim() || "Partner";
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

function squareIdempotencyKey(prefix: string, seed: string) {
  const hash = stableIdempotencyKey(seed);
  const allowedHashLength = Math.max(1, 45 - prefix.length - 1);
  return `${prefix}-${hash.slice(0, allowedHashLength)}`;
}

async function createSquareCustomer(params: {
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

async function createSquareCard(params: {
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

async function createSquareSubscription(params: {
  customerId: string;
  cardId: string;
  planVariationId: string;
  referenceId: string;
  startDate?: string;
}) {
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

async function cancelSquareSubscription(subscriptionId: string) {
  await squareRequest<{ subscription?: { id?: string } }>(
    `/v2/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
    {}
  );
}

async function disableSquareCard(cardId: string) {
  await squareRequest<{ card?: { id?: string } }>(
    `/v2/cards/${encodeURIComponent(cardId)}/disable`,
    {}
  );
}

function normalizeSquareStatus(status?: string | null) {
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterPartnerResponse>
) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let createdSubscriptionId: string | null = null;
  let createdCardId: string | null = null;

  try {
    const body = req.body ?? {};
    const selectedPlan = String(body.membershipPlan || "");
    const plan = PARTNER_SUBSCRIPTION_PLANS[selectedPlan as keyof typeof PARTNER_SUBSCRIPTION_PLANS];
    const paymentToken = String(body.paymentToken || body.cardToken || "").trim();

    if (!plan) {
      return res.status(400).json({ error: "A valid membershipPlan is required" });
    }

    if (!paymentToken) {
      return res.status(400).json({ error: "paymentToken is required" });
    }

    if (!squareLocationId) {
      return res.status(500).json({ error: "Missing env var SQUARE_LOCATION_ID" });
    }

    const email = String(body.organizationEmail || "").toLowerCase().trim();

    if (!email) {
      return res.status(400).json({ error: "organizationEmail is required" });
    }

    const displayId = `PT-${randomInt(100000000, 999999999)}`;
    const partnerCode = `PTR-${randomInt(100000, 999999)}`;
    const periodStart = new Date();
    const periodEnd = addOneMonth(periodStart);
    const referenceId = `partner-registration:${stableIdempotencyKey(`${email}:${selectedPlan}:${paymentToken}`)}`;
    const cardholderName = normalizeCardholderName(
      body.agentFirstName,
      body.agentLastName,
      body.organizationName
    );

    const squareCustomerId = await createSquareCustomer({
      email,
      firstName: body.agentFirstName,
      lastName: body.agentLastName,
      organizationName: body.organizationName,
      organizationPhone: body.organizationPhone,
      organizationAddress: body.organizationAddress,
      organizationCity: body.organizationCity,
      organizationState: body.organizationState,
      organizationZip: body.organizationZip,
      referenceId,
    });

    const squareCardId = await createSquareCard({
      paymentToken,
      customerId: squareCustomerId,
      cardholderName,
      organizationAddress: body.organizationAddress,
      organizationCity: body.organizationCity,
      organizationState: body.organizationState,
      organizationZip: body.organizationZip,
      referenceId,
    });
    createdCardId = squareCardId;

    const squarePlanVariationId = squarePlanVariationIds[selectedPlan as PartnerSubscriptionPlan];

    if (!squarePlanVariationId) {
      throw new Error(`Missing Square plan variation ID for membership plan ${selectedPlan}`);
    }

    const squareSubscription = await createSquareSubscription({
      customerId: squareCustomerId,
      cardId: squareCardId,
      planVariationId: squarePlanVariationId,
      referenceId,
    });
    createdSubscriptionId = squareSubscription.id ?? null;

    const cognitoUser = await createOrGetCognitoUser({
      email,
      firstName: body.agentFirstName,
      lastName: body.agentLastName,
      phoneNumber: body.agentPhone,
      userType: "partner",
    });

    const organizationZip = normalizeZip(body.organizationZip);
    const network =
      organizationZip.length === 5
        ? await prisma.network_codes.findUnique({
            where: { zip_code: organizationZip },
            select: { network_name: true, network_code: true },
          })
        : null;

    const profileData = {
      network_name: network?.network_name ?? optionalString(body.networkName),
      network_code: network?.network_code ?? optionalString(body.networkCode),
      agent_first_name: optionalString(body.agentFirstName),
      agent_last_name: optionalString(body.agentLastName),
      agent_phone: optionalString(body.agentPhone),
      org_name: optionalString(body.organizationName),
      org_address: optionalString(body.organizationAddress),
      org_city: optionalString(body.organizationCity),
      org_state: optionalString(body.organizationState),
      org_zip: organizationZip || null,
      org_email: optionalString(body.organizationEmail),
      org_phone: optionalString(body.organizationPhone),
      org_category: optionalString(body.organizationCategory),
      notification_enabled: Boolean(body.notificationEnabled),
      terms_accepted: Boolean(body.termsAccepted),
    };

    const result = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.users.findUnique({
        where: { cognito_id: cognitoUser.cognitoSub },
        select: { user_id: true, display_id: true },
      });

      const user = existingUser
        ? await tx.users.update({
            where: { user_id: existingUser.user_id },
            data: {
              email,
              first_name: optionalString(body.agentFirstName),
              last_name: optionalString(body.agentLastName),
              phone_number: optionalString(body.agentPhone),
              user_type: UserType.partner,
              display_id: existingUser.display_id || displayId,
            },
            select: { user_id: true, display_id: true },
          })
        : await tx.users.create({
            data: {
              cognito_id: cognitoUser.cognitoSub,
              email,
              first_name: optionalString(body.agentFirstName),
              last_name: optionalString(body.agentLastName),
              phone_number: optionalString(body.agentPhone),
              user_type: UserType.partner,
              display_id: displayId,
            },
            select: { user_id: true, display_id: true },
          });

      const role = await getOrCreateRole(tx, "partner");

      await tx.user_roles.upsert({
        where: {
          user_id_role_id: {
            user_id: user.user_id,
            role_id: role.role_id,
          },
        },
        update: {},
        create: {
          user_id: user.user_id,
          role_id: role.role_id,
        },
      });

      const partnerProfile = await tx.partner_profiles.upsert({
        where: { user_id: user.user_id },
        update: profileData,
        create: {
          user_id: user.user_id,
          partner_code: partnerCode,
          ...profileData,
        },
        select: { partner_code: true },
      });

      const subscriptionData = {
        plan: selectedPlan as PartnerSubscriptionPlan,
        status: normalizeSquareStatus(squareSubscription.status),
        billing_provider: BillingProvider.square,
        billing_provider_customer_id: squareCustomerId,
        billing_provider_subscription_id: squareSubscription.id,
        monthly_price_cents: plan.monthlyPriceCents,
        currency: "usd",
        max_providers: plan.maxProviders,
        current_period_start: squareSubscription.start_date
          ? new Date(squareSubscription.start_date)
          : periodStart,
        current_period_end: squareSubscription.current_period_end
          ? new Date(squareSubscription.current_period_end)
          : periodEnd,
      };

      const existingSubscription = await tx.partner_subscriptions.findFirst({
        where: { partner_id: user.user_id },
        orderBy: { created_at: "desc" },
        select: { subscription_id: true },
      });

      const subscription = existingSubscription
        ? await tx.partner_subscriptions.update({
            where: { subscription_id: existingSubscription.subscription_id },
            data: subscriptionData,
            select: { subscription_id: true },
          })
        : await tx.partner_subscriptions.create({
            data: {
              partner_id: user.user_id,
              ...subscriptionData,
            },
            select: { subscription_id: true },
          });

      return {
        user,
        partnerCode: partnerProfile.partner_code || partnerCode,
        subscription,
      };
    });

    return res.status(200).json({
      message: "Partner registered successfully",
      userId: result.user.user_id,
      displayId: result.user.display_id || displayId,
      partnerCode: result.partnerCode,
      subscriptionId: result.subscription.subscription_id,
      squareCustomerId,
      squareCardId,
      squareSubscriptionId: squareSubscription.id,
    });
  } catch (error) {
    if (createdSubscriptionId) {
      try {
        await cancelSquareSubscription(createdSubscriptionId);
      } catch (cleanupError) {
        console.error("Failed to cancel Square subscription after registration error", cleanupError);
      }
    }

    if (createdCardId) {
      try {
        await disableSquareCard(createdCardId);
      } catch (cleanupError) {
        console.error("Failed to disable Square card after registration error", cleanupError);
      }
    }

    console.error(error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to register partner",
    });
  }
}
