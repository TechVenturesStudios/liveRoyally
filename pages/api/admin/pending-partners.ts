import type { NextApiRequest, NextApiResponse } from "next";
import { BillingProvider, PartnerSubscriptionPlan, PartnerSubscriptionStatus } from "@prisma/client";

import { PARTNER_SUBSCRIPTION_PLANS } from "../../../src/config/subscriptionPlans";
import { resolveDashboardAccount } from "../../../lib/dashboard-account";
import { prisma } from "../../../lib/prisma";

type PendingPartnerResponse =
  | {
      pendingCount: number;
      pendingPartners: PendingPartner[];
    }
  | {
      error: string;
    };

export type PendingPartner = {
  subscriptionId: string;
  partnerId: string;
  partnerCode: string | null;
  organizationName: string;
  organizationCategory: string | null;
  agentFirstName: string | null;
  agentLastName: string | null;
  organizationEmail: string;
  organizationPhone: string | null;
  organizationAddress: string | null;
  organizationCity: string | null;
  organizationState: string | null;
  organizationZip: string | null;
  networkName: string | null;
  networkCode: string | null;
  plan: PartnerSubscriptionPlan;
  planLabel: string;
  monthlyPriceCents: number;
  currency: string;
  submittedAt: string | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PendingPartnerResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const account = await resolveDashboardAccount(req, ["admin"]);

    if (!account) {
      return res.status(500).json({ error: "Unable to resolve admin account" });
    }

    if ("error" in account) {
      return res.status(account.status).json({ error: account.error });
    }

    const pendingSubscriptions = await prisma.partner_subscriptions.findMany({
      where: {
        status: PartnerSubscriptionStatus.pending,
        approved_at: null,
        canceled_at: null,
        billing_provider: BillingProvider.square,
      },
      orderBy: { created_at: "asc" },
      select: {
        subscription_id: true,
        plan: true,
        monthly_price_cents: true,
        currency: true,
        created_at: true,
        users: {
          select: {
            user_id: true,
            email: true,
            partner_profiles: {
              select: {
                partner_code: true,
                network_name: true,
                network_code: true,
                agent_first_name: true,
                agent_last_name: true,
                org_name: true,
                org_category: true,
                org_address: true,
                org_city: true,
                org_state: true,
                org_zip: true,
                org_email: true,
                org_phone: true,
              },
            },
          },
        },
      },
    });

    const pendingPartners = pendingSubscriptions.map((subscription) => {
      const profile = subscription.users.partner_profiles;
      const organizationName =
        profile?.org_name?.trim() ||
        [subscription.users.email].filter(Boolean).join(" ").trim() ||
        "Pending partner";

      const plan = subscription.plan;
      const planConfig = PARTNER_SUBSCRIPTION_PLANS[plan];

      return {
        subscriptionId: subscription.subscription_id,
        partnerId: subscription.users.user_id,
        partnerCode: profile?.partner_code ?? null,
        organizationName,
        organizationCategory: profile?.org_category ?? null,
        agentFirstName: profile?.agent_first_name ?? null,
        agentLastName: profile?.agent_last_name ?? null,
        organizationEmail: profile?.org_email?.trim() || subscription.users.email,
        organizationPhone: profile?.org_phone ?? null,
        organizationAddress: profile?.org_address ?? null,
        organizationCity: profile?.org_city ?? null,
        organizationState: profile?.org_state ?? null,
        organizationZip: profile?.org_zip ?? null,
        networkName: profile?.network_name ?? null,
        networkCode: profile?.network_code ?? null,
        plan,
        planLabel: planConfig.label,
        monthlyPriceCents: subscription.monthly_price_cents,
        currency: subscription.currency,
        submittedAt: subscription.created_at?.toISOString() ?? null,
      };
    });

    return res.status(200).json({
      pendingCount: pendingPartners.length,
      pendingPartners,
    });
  } catch (error) {
    console.error("admin pending-partners list error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to load pending partners",
    });
  }
}
