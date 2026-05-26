import type { NextApiRequest, NextApiResponse } from "next";
import { randomInt } from "crypto";
import {
  BillingProvider,
  PartnerSubscriptionPlan,
  PartnerSubscriptionStatus,
  UserType,
} from "@prisma/client";
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
    }
  | {
      error: string;
    };

const addOneMonth = (date: Date) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
};

const buildOrganizationAddress = (body: Record<string, unknown>) => {
  return [
    body.organizationAddress,
    body.organizationCity,
    body.organizationState,
    body.organizationZip,
  ]
    .filter(Boolean)
    .map(String)
    .join(", ");
};

const optionalString = (value: unknown) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return String(value);
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

  try {
    const body = req.body ?? {};
    const cognitoId = body.cognitoSub || body.cognitoId;
    const selectedPlan = String(body.membershipPlan || "");
    const plan = PARTNER_SUBSCRIPTION_PLANS[selectedPlan as keyof typeof PARTNER_SUBSCRIPTION_PLANS];

    if (!cognitoId) {
      return res.status(400).json({ error: "cognitoSub is required" });
    }

    if (!plan) {
      return res.status(400).json({ error: "A valid membershipPlan is required" });
    }

    const displayId = `PT-${randomInt(100000000, 999999999)}`;
    const partnerCode = `PTR-${randomInt(100000, 999999)}`;
    const periodStart = new Date();
    const periodEnd = addOneMonth(periodStart);

    const email = String(body.organizationEmail || "").toLowerCase().trim();
    const profileData = {
      network_name: optionalString(body.networkName),
      network_code: optionalString(body.networkCode),
      agent_first_name: optionalString(body.agentFirstName),
      agent_last_name: optionalString(body.agentLastName),
      agent_phone: optionalString(body.agentPhone),
      org_name: optionalString(body.organizationName),
      org_address: buildOrganizationAddress(body),
      org_email: optionalString(body.organizationEmail),
      org_phone: optionalString(body.organizationPhone),
      notification_enabled: Boolean(body.notificationEnabled),
      terms_accepted: Boolean(body.termsAccepted),
    };

    const result = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.users.findUnique({
        where: { cognito_id: String(cognitoId) },
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
              cognito_id: String(cognitoId),
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

      const existingSubscription = await tx.partner_subscriptions.findFirst({
        where: { partner_id: user.user_id },
        orderBy: { created_at: "desc" },
        select: { subscription_id: true },
      });

      const subscriptionData = {
        plan: selectedPlan as PartnerSubscriptionPlan,
        status: PartnerSubscriptionStatus.active,
        billing_provider: BillingProvider.square,
        monthly_price_cents: plan.monthlyPriceCents,
        currency: "usd",
        max_providers: plan.maxProviders,
        current_period_start: periodStart,
        current_period_end: periodEnd,
      };

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
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to register partner",
    });
  }
}
