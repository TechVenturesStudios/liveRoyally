import type { NextApiRequest, NextApiResponse } from "next";
import { PartnerSubscriptionStatus, Prisma } from "@prisma/client";

import { prisma } from "../../../lib/prisma";
import { resolveDashboardAccount } from "../../../lib/dashboard-account";
import { deriveEventLifecycleStatus } from "@/utils/eventStatus";

type AdminOverviewNetwork = {
  name: string;
  code: string;
  combinedPoints: number;
};

type AdminOverviewResponse =
  | {
      completedEventCount: number;
      networksWithActivePartners: number;
      topNetworks: AdminOverviewNetwork[];
    }
  | {
      error: string;
    };

type NetworkPointsRow = {
  network_key: string;
  network_name: string | null;
  combined_points: number | string | bigint;
};

const toNumber = (value: number | string | bigint | null | undefined) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const networkKey = (networkCode: string | null | undefined, networkName: string | null | undefined) => {
  const code = networkCode?.trim();
  if (code) return code;

  const name = networkName?.trim();
  if (name) return name;

  return "Unassigned Network";
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminOverviewResponse>
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

    const year = new Date().getFullYear();

    const [events, activePartnerSubscriptions, networkPointsRows] = await Promise.all([
      prisma.events.findMany({
        select: {
          start_date: true,
          end_date: true,
          response_deadline: true,
          status: true,
          event_provider_invites: {
            select: {
              status: true,
            },
          },
        },
      }),
      prisma.partner_subscriptions.findMany({
        where: {
          status: PartnerSubscriptionStatus.active,
          approved_at: { not: null },
          canceled_at: null,
        },
        select: {
          users: {
            select: {
              partner_profiles: {
                select: {
                  network_code: true,
                  network_name: true,
                },
              },
            },
          },
        },
      }),
      prisma.$queryRaw<NetworkPointsRow[]>(Prisma.sql`
        WITH network_users AS (
          SELECT
            COALESCE(NULLIF(TRIM(pp.network_code), ''), NULLIF(TRIM(pp.network_name), ''), 'Unassigned Network') AS network_key,
            NULLIF(TRIM(pp.network_name), '') AS network_name,
            pp.user_id
          FROM partner_profiles pp
          UNION ALL
          SELECT
            COALESCE(NULLIF(TRIM(pr.network_code), ''), NULLIF(TRIM(pr.network_name), ''), 'Unassigned Network') AS network_key,
            NULLIF(TRIM(pr.network_name), '') AS network_name,
            pr.user_id
          FROM provider_profiles pr
        )
        SELECT
          nu.network_key,
          COALESCE(MAX(nu.network_name), nu.network_key) AS network_name,
          COALESCE(SUM(COALESCE(ra.points_balance, 0)), 0)::int AS combined_points
        FROM network_users nu
        LEFT JOIN reward_accounts ra
          ON ra.user_id = nu.user_id
         AND ra.reward_year = ${year}
        GROUP BY nu.network_key
        ORDER BY combined_points DESC, network_name ASC
        LIMIT 3
      `),
    ]);

    const completedEventCount = events.filter((event) =>
      deriveEventLifecycleStatus({
        startDate: event.start_date,
        endDate: event.end_date,
        responseDeadline: event.response_deadline,
        inviteStatuses: event.event_provider_invites.map((invite) => invite.status),
      }) === "completed"
    ).length;

    const activeNetworkKeys = new Set<string>();

    for (const subscription of activePartnerSubscriptions) {
      const profile = subscription.users.partner_profiles;
      if (!profile) continue;
      activeNetworkKeys.add(networkKey(profile.network_code, profile.network_name));
    }

    const topNetworks = networkPointsRows.map((network) => ({
      name: network.network_name?.trim() || network.network_key,
      code: network.network_key,
      combinedPoints: toNumber(network.combined_points),
    }));

    return res.status(200).json({
      completedEventCount,
      networksWithActivePartners: activeNetworkKeys.size,
      topNetworks,
    });
  } catch (error) {
    console.error("admin overview error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to load admin overview",
    });
  }
}
