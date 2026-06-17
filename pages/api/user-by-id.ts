import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";

type UserByIdResponse =
  | {
      user_id: string;
      cognito_id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
      phone_number: string | null;
      user_type: string | null;
      display_id: string | null;
      profile: Record<string, unknown>;
    }
  | {
      error: string;
    };

function setCorsHeaders(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UserByIdResponse>
) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const cognitoId = String(req.query.cognitoId || req.query.cognito_id || "").trim();

    if (!cognitoId) {
      return res.status(400).json({ error: "Missing cognitoId" });
    }

    const user = await prisma.users.findUnique({
      where: { cognito_id: cognitoId },
      select: {
        user_id: true,
        cognito_id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        user_type: true,
        display_id: true,
        member_profiles: true,
        provider_profiles: {
          select: {
            partner_id: true,
            network_name: true,
            network_code: true,
            agent_first_name: true,
            agent_last_name: true,
            agent_phone: true,
            business_name: true,
            business_category: true,
            business_address: true,
            business_city: true,
            business_state: true,
            business_zip: true,
            business_email: true,
            business_phone: true,
            notification_enabled: true,
            terms_accepted: true,
          },
        },
        partner_profiles: true,
        partner_subscriptions: {
          orderBy: { created_at: "desc" },
          take: 1,
          select: {
            plan: true,
            status: true,
            monthly_price_cents: true,
            currency: true,
            max_providers: true,
            current_period_start: true,
            current_period_end: true,
            created_at: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const memberProfile = user.member_profiles;
    const providerProfile = user.provider_profiles;
    const partnerProfile = user.partner_profiles;
    const partnerSubscription = user.partner_subscriptions[0] ?? null;
    const providerPartnerProfile = providerProfile?.partner_id
      ? await prisma.partner_profiles.findUnique({
          where: { user_id: providerProfile.partner_id },
          select: {
            org_name: true,
            partner_code: true,
          },
        })
      : null;
    const currentProviderCount = partnerProfile
      ? await prisma.$queryRaw<[{ count: number }]>`
          SELECT COUNT(*)::int AS count
          FROM provider_profiles
          WHERE partner_id = ${user.user_id}::uuid
        `
      : null;

    return res.status(200).json({
      user_id: user.user_id,
      cognito_id: user.cognito_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
      user_type: user.user_type,
      display_id: user.display_id,
      profile: {
        networkName:
          memberProfile?.network_name ??
          providerProfile?.network_name ??
          partnerProfile?.network_name ??
          null,
        networkCode:
          memberProfile?.network_code ??
          providerProfile?.network_code ??
          partnerProfile?.network_code ??
          null,
        notificationEnabled:
          memberProfile?.notification_enabled ??
          providerProfile?.notification_enabled ??
          partnerProfile?.notification_enabled ??
          null,
        termsAccepted:
          memberProfile?.terms_accepted ??
          providerProfile?.terms_accepted ??
          partnerProfile?.terms_accepted ??
          null,

        zipCode: memberProfile?.zip_code ?? null,
        ethnicity: memberProfile?.ethnicity ?? null,
        ageGroup: memberProfile?.age_group ?? null,
        gender: memberProfile?.gender ?? null,

        partnerId: providerProfile?.partner_id ?? null,
        partnerName: providerPartnerProfile?.org_name ?? null,
        partnerCode: partnerProfile?.partner_code ?? providerPartnerProfile?.partner_code ?? null,
        agentFirstName: providerProfile?.agent_first_name ?? null,
        agentLastName: providerProfile?.agent_last_name ?? null,
        agentPhone: providerProfile?.agent_phone ?? null,
        businessName: providerProfile?.business_name ?? null,
        businessCategory: providerProfile?.business_category ?? null,
        businessAddress: providerProfile?.business_address ?? null,
        businessCity: providerProfile?.business_city ?? null,
        businessState: providerProfile?.business_state ?? null,
        businessZip: providerProfile?.business_zip ?? null,
        businessEmail: providerProfile?.business_email ?? null,
        businessPhone: providerProfile?.business_phone ?? null,

        partnerAgentFirstName: partnerProfile?.agent_first_name ?? null,
        partnerAgentLastName: partnerProfile?.agent_last_name ?? null,
        partnerAgentPhone: partnerProfile?.agent_phone ?? null,
        organizationName: partnerProfile?.org_name ?? null,
        organizationAddress: partnerProfile?.org_address ?? null,
        organizationCity: partnerProfile?.org_city ?? null,
        organizationState: partnerProfile?.org_state ?? null,
        organizationZip: partnerProfile?.org_zip ?? null,
        organizationCategory: partnerProfile?.org_category ?? null,
        organizationEmail: partnerProfile?.org_email ?? null,
        organizationPhone: partnerProfile?.org_phone ?? null,
        membershipPlan: partnerSubscription?.plan ?? null,
        membershipStatus: partnerSubscription?.status ?? null,
        membershipPrice:
          partnerSubscription?.monthly_price_cents !== undefined &&
          partnerSubscription?.monthly_price_cents !== null
            ? partnerSubscription.monthly_price_cents / 100
            : null,
        membershipCurrency: partnerSubscription?.currency ?? null,
        subscriptionStartDate:
          partnerSubscription?.current_period_start ??
          partnerSubscription?.created_at ??
          null,
        subscriptionEndDate: partnerSubscription?.current_period_end ?? null,
        maxProviders: partnerSubscription?.max_providers ?? null,
        currentProviders: currentProviderCount?.[0]?.count ?? null,
      },
    });
  } catch (error) {
    console.error("user-by-id error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch user profile",
    });
  }
}
