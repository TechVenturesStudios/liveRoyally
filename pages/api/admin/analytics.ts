 import type { NextApiRequest, NextApiResponse } from "next";
import { PartnerSubscriptionStatus, UserType } from "@prisma/client";

import { PARTNER_SUBSCRIPTION_PLANS } from "../../../src/config/subscriptionPlans";
import { deriveEventLifecycleStatus } from "../../../src/utils/eventStatus";
import { resolveDashboardAccount } from "../../../lib/dashboard-account";
import { prisma } from "../../../lib/prisma";

type AnalyticsResponse =
  | { totals: object; partners: object[]; networks: object[] }
  | { error: string };

const text = (value: string | null | undefined, fallback = "") => value?.trim() || fallback;
const networkKey = (code: string | null | undefined, name: string | null | undefined) =>
  text(code, text(name, "Unassigned Network"));

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyticsResponse>
) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const account = await resolveDashboardAccount(req, ["admin"]);
    if (!account) return res.status(500).json({ error: "Unable to resolve admin account" });
    if ("error" in account) return res.status(account.status).json({ error: account.error });

    const year = new Date().getFullYear();
    const [partners, providers, members, pendingPartners] = await Promise.all([
      prisma.users.findMany({
        where: { user_type: UserType.partner },
        orderBy: { created_at: "asc" },
        select: {
          user_id: true, email: true, created_at: true,
          partner_profiles: {
            select: {
              network_code: true, network_name: true, org_name: true, org_category: true,
              org_city: true, org_state: true,
            },
          },
          partner_subscriptions: {
            orderBy: { created_at: "desc" },
            select: { plan: true, status: true, approved_at: true, canceled_at: true },
          },
          events: {
            select: {
              start_date: true, end_date: true, response_deadline: true,
              event_provider_invites: { select: { status: true } },
            },
          },
        },
      }),
      prisma.provider_profiles.findMany({
        where: { users: { user_type: UserType.provider } },
        select: {
          user_id: true, partner_id: true, network_code: true, network_name: true, created_at: true,
        },
      }),
      prisma.users.findMany({
        where: { user_type: UserType.member },
        select: {
          user_id: true,
          created_at: true,
          member_profiles: { select: { network_code: true, network_name: true, created_at: true } },
          reward_accounts: {
            where: { reward_year: year },
            select: { points_balance: true, points_earned: true },
          },
        },
      }),
      prisma.partner_subscriptions.count({
        where: {
          status: PartnerSubscriptionStatus.pending,
          approved_at: null,
          canceled_at: null,
        },
      }),
    ]);

    const providerCounts = new Map<string, number>();
    providers.forEach((provider) => {
      if (provider.partner_id) {
        providerCounts.set(provider.partner_id, (providerCounts.get(provider.partner_id) ?? 0) + 1);
      }
    });

    const partnerRows = partners.map((partner) => {
      const profile = partner.partner_profiles;
      const publishedEvents = partner.events.filter((event) => deriveEventLifecycleStatus({
        startDate: event.start_date,
        endDate: event.end_date,
        responseDeadline: event.response_deadline,
        inviteStatuses: event.event_provider_invites.map((invite) => invite.status),
      }) !== "pending").length;
      const plan = partner.partner_subscriptions.find(
        (subscription) => subscription.status === PartnerSubscriptionStatus.active &&
          subscription.approved_at && !subscription.canceled_at
      )?.plan ?? partner.partner_subscriptions[0]?.plan;

      return {
        id: partner.user_id,
        organizationName: text(profile?.org_name, text(partner.email, "Unnamed partner")),
        organizationCategory: text(profile?.org_category, "Uncategorized"),
        plan: plan ? PARTNER_SUBSCRIPTION_PLANS[plan].label : "Free",
        joinDate: (partner.created_at ?? new Date()).toISOString(),
        publishedEvents,
        pendingEvents: partner.events.length - publishedEvents,
        totalProviders: providerCounts.get(partner.user_id) ?? 0,
        city: text(profile?.org_city),
        state: text(profile?.org_state),
        networkCode: networkKey(profile?.network_code, profile?.network_name),
        networkName: text(profile?.network_name, networkKey(profile?.network_code, profile?.network_name)),
      };
    });

    const networkMap = new Map<string, {
      name: string;
      members: number;
      activeMembers: number;
      providers: number;
      events: number;
      launchDate: Date | null;
      partnerIds: string[];
    }>();
    const ensureNetwork = (code: string | null | undefined, name: string | null | undefined, date?: Date | null) => {
      const key = networkKey(code, name);
      const existing = networkMap.get(key) ?? {
        name: text(name, key), members: 0, activeMembers: 0, providers: 0,
        events: 0, launchDate: null, partnerIds: [],
      };
      if (!existing.name || existing.name === "Unassigned Network") existing.name = text(name, key);
      if (date && (!existing.launchDate || date < existing.launchDate)) existing.launchDate = date;
      networkMap.set(key, existing);
      return { key, existing };
    };

    members.forEach((member) => {
      const profile = member.member_profiles;
      if (!profile) return;
      const { existing } = ensureNetwork(profile.network_code, profile.network_name, profile.created_at ?? member.created_at);
      existing.members += 1;
      if (member.reward_accounts.some((account) => account.points_earned > 0 || account.points_balance > 0)) {
        existing.activeMembers += 1;
      }
    });

    partnerRows.forEach((partner) => {
      const { existing } = ensureNetwork(partner.networkCode, partner.networkName, new Date(partner.joinDate));
      existing.events += partner.publishedEvents + partner.pendingEvents;
      existing.partnerIds.push(partner.id);
    });
    providers.forEach((provider) => {
      ensureNetwork(provider.network_code, provider.network_name, provider.created_at).existing.providers += 1;
    });

    const networks = Array.from(networkMap.entries()).map(([code, network]) => {
      const topPartner = partnerRows
        .filter((partner) => partner.networkCode === code)
        .sort((a, b) => b.totalProviders - a.totalProviders || b.publishedEvents - a.publishedEvents)[0];
      return {
        network: network.name,
        code,
        activeMembers: network.activeMembers,
        totalMembers: network.members,
        topPartner: topPartner?.organizationName ?? "No partners",
        totalProviders: network.providers,
        totalEvents: network.events,
        launchDate: (network.launchDate ?? new Date()).toISOString(),
      };
    }).sort((a, b) => a.network.localeCompare(b.network));

    return res.status(200).json({
      totals: {
        partners: partnerRows.length,
        providers: providers.length,
        members: members.length,
        pendingPartners,
      },
      partners: partnerRows,
      networks,
    });
  } catch (error) {
    console.error("admin analytics error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load admin analytics" });
  }
}
