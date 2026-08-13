import type { NextApiRequest, NextApiResponse } from "next";
import { randomInt } from "crypto";
import { BillingProvider, PartnerSubscriptionPlan, PartnerSubscriptionStatus, UserType } from "@prisma/client";

import { createOrGetCognitoUser } from "../../lib/cognito-admin";
import { prisma } from "../../lib/prisma";
import { createSquareCard, createSquareCustomer, disableSquareCard, squareIdempotencyKey } from "../../lib/square-partner-billing";
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
      subscriptionStatus: PartnerSubscriptionStatus;
    }
  | {
      error: string;
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

    const email = String(body.organizationEmail || "").toLowerCase().trim();

    if (!email) {
      return res.status(400).json({ error: "organizationEmail is required" });
    }

    const displayId = `PT-${randomInt(100000000, 999999999)}`;
    const partnerCode = `PTR-${randomInt(100000, 999999)}`;
    const referenceId = squareIdempotencyKey(
      "partner-registration",
      `${email}:${selectedPlan}:${paymentToken}`
    );
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
        status: PartnerSubscriptionStatus.pending,
        billing_provider: BillingProvider.square,
        billing_provider_customer_id: squareCustomerId,
        billing_provider_card_id: squareCardId,
        billing_provider_subscription_id: null,
        monthly_price_cents: plan.monthlyPriceCents,
        currency: "usd",
        max_providers: plan.maxProviders,
        current_period_start: null,
        current_period_end: null,
        approved_at: null,
        canceled_at: null,
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
      subscriptionStatus: PartnerSubscriptionStatus.pending,
    });
  } catch (error) {
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
