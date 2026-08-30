import type { NextApiRequest, NextApiResponse } from "next";
import { PartnerSubscriptionStatus, UserType } from "@prisma/client";

import { PARTNER_SUBSCRIPTION_PLANS } from "../../../src/config/subscriptionPlans";
import { deriveEventLifecycleStatus } from "../../../src/utils/eventStatus";
import { resolveDashboardAccount } from "../../../lib/dashboard-account";
import { prisma } from "../../../lib/prisma";

type DirectoryResponse =
  | { partners: unknown[]; providers: unknown[] }
  | { error: string };

const text = (value: string | null | undefined, fallback = "") => value?.trim() || fallback;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DirectoryResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const account = await resolveDashboardAccount(req, ["admin"]);
    if (!account) return res.status(500).json({ error: "Unable to resolve admin account" });
    if ("error" in account) return res.status(account.status).json({ error: account.error });

    const [partnerProfiles, providerProfiles] = await Promise.all([
      prisma.users.findMany({
        where: { user_type: UserType.partner },
        orderBy: { created_at: "asc" },
        select: {
          user_id: true,
          email: true,
          created_at: true,
          partner_profiles: {
            select: {
              network_name: true, network_code: true, agent_first_name: true,
              agent_last_name: true, org_name: true, org_category: true,
              org_city: true, org_state: true, org_email: true, org_phone: true,
            },
          },
          partner_subscriptions: {
            orderBy: { created_at: "desc" },
            select: { plan: true, status: true, approved_at: true, canceled_at: true },
          },
          events: {
            select: {
              start_date: true, end_date: true, response_deadline: true,
              status: true, event_provider_invites: { select: { status: true } },
            },
          },
        },
      }),
      prisma.provider_profiles.findMany({
        where: { users: { user_type: UserType.provider } },
        orderBy: { created_at: "asc" },
        select: {
          user_id: true,
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
          network_code: true,
          network_name: true,
          partner: { select: { user_id: true, partner_profiles: { select: { org_name: true } } } },
          users: { select: { email: true } },
        },
      }),
    ]);

    const partners = partnerProfiles.map((profile) => {
      const partnerProfile = profile.partner_profiles;
      const events = profile.events;
      const publishedEvents = events.filter((event) => deriveEventLifecycleStatus({
        startDate: event.start_date,
        endDate: event.end_date,
        responseDeadline: event.response_deadline,
        inviteStatuses: event.event_provider_invites.map((invite) => invite.status),
      }) !== "pending").length;
      const pendingEvents = events.length - publishedEvents;
      const activeSubscription = profile.partner_subscriptions.find(
        (subscription) => subscription.status === PartnerSubscriptionStatus.active &&
          subscription.approved_at && !subscription.canceled_at
      );
      const plan = activeSubscription?.plan ?? profile.partner_subscriptions[0]?.plan;

      return {
        id: profile.user_id,
        organizationName: text(partnerProfile?.org_name, text(profile.email, "Unnamed partner")),
        organizationCategory: text(partnerProfile?.org_category, "Uncategorized"),
        agentFirstName: text(partnerProfile?.agent_first_name),
        agentLastName: text(partnerProfile?.agent_last_name),
        organizationEmail: text(partnerProfile?.org_email, profile.email),
        organizationPhone: text(partnerProfile?.org_phone),
        organizationCity: text(partnerProfile?.org_city),
        organizationState: text(partnerProfile?.org_state),
        plan: plan ? PARTNER_SUBSCRIPTION_PLANS[plan].label : "Free",
        joinDate: (profile.created_at ?? new Date()).toISOString(),
        publishedEvents,
        pendingEvents,
        totalProviders: 0,
      };
    });

    const providerCounts = new Map<string, number>();
    for (const provider of providerProfiles) {
      const partnerId = provider.partner?.user_id;
      if (partnerId) providerCounts.set(partnerId, (providerCounts.get(partnerId) ?? 0) + 1);
    }
    partners.forEach((partner) => {
      partner.totalProviders = providerCounts.get(partner.id) ?? 0;
    });

    const providers = providerProfiles.map((profile) => ({
      id: profile.user_id,
      businessName: text(profile.business_name, text(profile.users.email, "Unnamed provider")),
      businessCategory: text(profile.business_category, "Uncategorized"),
      agentFirstName: text(profile.agent_first_name),
      agentLastName: text(profile.agent_last_name),
      agentPhone: text(profile.agent_phone),
      businessEmail: text(profile.business_email, profile.users.email),
      businessPhone: text(profile.business_phone),
      businessAddress: text(profile.business_address),
      businessCity: text(profile.business_city),
      businessState: text(profile.business_state),
      businessZip: text(profile.business_zip),
      partnerName: text(profile.partner?.partner_profiles?.org_name, "Unassigned partner"),
      networkCode: text(profile.network_code, text(profile.network_name, "Unassigned network")),
    }));

    return res.status(200).json({ partners, providers });
  } catch (error) {
    console.error("admin directory error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load admin directory" });
  }
}
