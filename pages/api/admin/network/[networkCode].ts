import type { NextApiRequest, NextApiResponse } from "next";
import { UserType } from "@prisma/client";

import { resolveDashboardAccount } from "../../../../lib/dashboard-account";
import { prisma } from "../../../../lib/prisma";

type NetworkResponse =
  | {
      name: string;
      code: string;
      partners: unknown[];
      providers: unknown[];
    }
  | { error: string };

const text = (value: string | null | undefined, fallback = "") => value?.trim() || fallback;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NetworkResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const account = await resolveDashboardAccount(req, ["admin"]);
    if (!account) return res.status(500).json({ error: "Unable to resolve admin account" });
    if ("error" in account) return res.status(account.status).json({ error: account.error });

    const requestedNetwork = decodeURIComponent(String(req.query.networkCode || "")).trim();
    if (!requestedNetwork) return res.status(400).json({ error: "Network code is required" });

    const [partnerProfiles, providerProfiles] = await Promise.all([
      prisma.partner_profiles.findMany({
        where: {
          users: { user_type: UserType.partner },
          OR: [{ network_code: requestedNetwork }, { network_name: requestedNetwork }],
        },
        orderBy: { org_name: "asc" },
        select: {
          user_id: true,
          network_code: true,
          network_name: true,
          org_name: true,
          org_category: true,
          agent_first_name: true,
          agent_last_name: true,
          agent_phone: true,
          org_email: true,
          org_phone: true,
          org_city: true,
          org_state: true,
        },
      }),
      prisma.provider_profiles.findMany({
        where: {
          users: { user_type: UserType.provider },
          OR: [{ network_code: requestedNetwork }, { network_name: requestedNetwork }],
        },
        orderBy: { business_name: "asc" },
        select: {
          user_id: true,
          partner_id: true,
          network_code: true,
          network_name: true,
          business_name: true,
          business_category: true,
          agent_first_name: true,
          agent_last_name: true,
          agent_phone: true,
          business_email: true,
          business_phone: true,
          business_address: true,
          business_city: true,
          business_state: true,
          business_zip: true,
          partner: { select: { partner_profiles: { select: { org_name: true } } } },
          users: { select: { email: true } },
        },
      }),
    ]);

    const matchesRequestedNetwork = (profile: { network_code: string | null; network_name: string | null }) =>
      profile.network_code?.trim() === requestedNetwork ||
      (!profile.network_code?.trim() && profile.network_name?.trim() === requestedNetwork);
    const matchingPartnerProfiles = partnerProfiles.filter(matchesRequestedNetwork);
    const matchingProviderProfiles = providerProfiles.filter(matchesRequestedNetwork);

    const partnerNames = new Map(
      matchingPartnerProfiles.map((partner) => [
        partner.user_id,
        text(partner.org_name, "Unnamed partner"),
      ])
    );
    const providerCounts = new Map<string, number>();
    matchingProviderProfiles.forEach((provider) => {
      if (provider.partner_id) {
        providerCounts.set(provider.partner_id, (providerCounts.get(provider.partner_id) ?? 0) + 1);
      }
    });

    const partners = matchingPartnerProfiles.map((partner) => ({
      id: partner.user_id,
      name: text(partner.org_name, "Unnamed partner"),
      category: text(partner.org_category, "Partner"),
      contactName: [partner.agent_first_name, partner.agent_last_name].filter(Boolean).join(" "),
      contactPhone: text(partner.agent_phone),
      email: text(partner.org_email),
      phone: text(partner.org_phone),
      city: text(partner.org_city),
      state: text(partner.org_state),
      providerCount: providerCounts.get(partner.user_id) ?? 0,
    }));

    const providers = matchingProviderProfiles.map((provider) => ({
      id: provider.user_id,
      businessName: text(provider.business_name, text(provider.users.email, "Unnamed provider")),
      businessCategory: text(provider.business_category, "Uncategorized"),
      agentFirstName: text(provider.agent_first_name),
      agentLastName: text(provider.agent_last_name),
      agentPhone: text(provider.agent_phone),
      businessEmail: text(provider.business_email, provider.users.email),
      businessPhone: text(provider.business_phone),
      businessAddress: text(provider.business_address),
      businessCity: text(provider.business_city),
      businessState: text(provider.business_state),
      businessZip: text(provider.business_zip),
      partnerId: provider.partner_id,
      partnerName: provider.partner_id
        ? partnerNames.get(provider.partner_id) ?? text(provider.partner?.partner_profiles?.org_name, "Unassigned partner")
        : "Unassigned partner",
    }));

    const firstProfile = matchingPartnerProfiles[0];
    const firstProvider = matchingProviderProfiles[0];
    const name = text(firstProfile?.network_name, text(firstProvider?.network_name, requestedNetwork));
    const code = text(firstProfile?.network_code, text(firstProvider?.network_code, requestedNetwork));

    return res.status(200).json({ name, code, partners, providers });
  } catch (error) {
    console.error("admin network detail error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load network" });
  }
}
