import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { resolveDashboardAccount } from "../../lib/dashboard-account";

type RewardTierSummary = {
  name: string;
  minPoints: number;
  maxPoints: number | null;
};

type EngagementAnalyticsMilestone = {
  taskId: string;
  name: string;
  points: number;
  earned: boolean;
  completedAt: string | null;
};

export type EngagementAnalyticsProviderRanking = {
  userId: string;
  displayId: string | null;
  firstName: string | null;
  lastName: string | null;
  businessName: string | null;
  points: number;
  rank: number;
};

export type EngagementAnalyticsPartnerInfo = {
  partnerId: string;
  partnerName: string | null;
  partnerCode: string | null;
} | null;

export type EngagementAnalyticsPartnerStanding = {
  rank: number;
  totalPartners: number;
  averagePoints: number;
} | null;

export type EngagementAnalyticsPartnerCapacity = {
  currentProviders: number;
  maxProviders: number | null;
  remainingProviders: number | null;
} | null;

type EngagementAnalyticsResponse =
  | {
      year: number;
      points: {
        balance: number;
        tier: RewardTierSummary;
        nextTier: {
          name: string;
          minPoints: number;
        } | null;
        pointsToNextTier: number;
      };
      goals: [];
      streak: {
        currentWeeks: number;
      };
      milestones: EngagementAnalyticsMilestone[];
      partnerStanding: EngagementAnalyticsPartnerStanding;
      partnerProviderCapacity: EngagementAnalyticsPartnerCapacity;
      providerNetwork: EngagementAnalyticsPartnerInfo;
      partnerProviders: EngagementAnalyticsProviderRanking[];
      memberVoucherRedeemedCount: number;
      providerHostedCompletedEvents: number;
      providerVoucherHonoredCount: number;
    }
  | {
      error: string;
    };

type RewardTierRecord = {
  tier_id: string;
  name: string;
  min_points: number;
  max_points: number | null;
  display_order: number;
};

function setCorsHeaders(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET");
}

function resolveCurrentTier(tiers: RewardTierRecord[], points: number) {
  const exactMatch = tiers.find(
    (tier) => points >= tier.min_points && (tier.max_points === null || points <= tier.max_points)
  );

  if (exactMatch) {
    return exactMatch;
  }

  const fallback = [...tiers].reverse().find((tier) => points >= tier.min_points);
  return fallback ?? tiers[0] ?? null;
}

function resolveNextTier(tiers: RewardTierRecord[], currentTier: RewardTierRecord | null) {
  if (!currentTier) {
    return null;
  }

  const currentIndex = tiers.findIndex((tier) => tier.tier_id === currentTier.tier_id);
  if (currentIndex < 0) {
    return tiers.find((tier) => tier.min_points > currentTier.min_points) ?? null;
  }

  return tiers[currentIndex + 1] ?? null;
}

function isCompletedHostedEvent(status: string | null | undefined, startDate: Date | string | null | undefined) {
  if (status === "completed") {
    return true;
  }

  if (!startDate) {
    return false;
  }

  const date = startDate instanceof Date ? startDate : new Date(startDate);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date < today;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EngagementAnalyticsResponse>
) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const account = await resolveDashboardAccount(req, ["member", "provider", "partner"]);
    if (!account) {
      return res.status(500).json({ error: "Failed to resolve account" });
    }
    if ("error" in account) {
      return res.status(account.status).json({ error: account.error });
    }

    const year = new Date().getFullYear();
    const isMember = account.actingUserType === "member";
    const isProvider = account.actingUserType === "provider";
    const isPartner = account.actingUserType === "partner";

    const [
      rewardAccount,
      rewardStreak,
      tiers,
      milestoneTasks,
      providerProfile,
      partnerSubscription,
      partnerProviderCount,
      memberVoucherRedeemedCount,
      providerHostedEvents,
      providerVoucherHonoredCount,
    ] = await Promise.all([
      prisma.reward_accounts.findFirst({
        where: {
          user_id: account.actingUserId,
          reward_year: year,
        },
        select: {
          points_balance: true,
        },
      }),
      prisma.reward_streaks.findFirst({
        where: {
          user_id: account.actingUserId,
          reward_year: year,
        },
        select: {
          current_streak: true,
        },
      }),
      prisma.reward_tiers.findMany({
        where: {
          user_type: account.actingUserType,
          active: true,
        },
        orderBy: [
          {
            display_order: "asc",
          },
          {
            min_points: "asc",
          },
        ],
        select: {
          tier_id: true,
          name: true,
          min_points: true,
          max_points: true,
          display_order: true,
        },
      }),
      prisma.reward_tasks.findMany({
        where: {
          user_type: account.actingUserType,
          active: true,
        },
        orderBy: [
          {
            display_order: "asc",
          },
          {
            name: "asc",
          },
        ],
        select: {
          task_id: true,
          name: true,
          points: true,
          completions: {
            where: {
              user_id: account.actingUserId,
              reward_year: year,
            },
            orderBy: {
              completed_at: "desc",
            },
            take: 1,
            select: {
              completed_at: true,
            },
          },
        },
      }),
      isProvider
        ? prisma.provider_profiles.findUnique({
            where: { user_id: account.actingUserId },
            select: {
              partner_id: true,
              network_name: true,
              network_code: true,
            },
          })
        : Promise.resolve(null),
      isPartner
        ? prisma.partner_subscriptions.findFirst({
            where: {
              partner_id: account.actingUserId,
              status: "active",
            },
            orderBy: {
              created_at: "desc",
            },
            select: {
              max_providers: true,
            },
          })
        : Promise.resolve(null),
      isPartner
        ? prisma.provider_profiles.count({
            where: {
              partner_id: account.actingUserId,
            },
          })
        : Promise.resolve(0),
      isMember
        ? prisma.$queryRaw<Array<{ count: number }>>`
            SELECT COUNT(*)::int AS count
            FROM purchases p
            INNER JOIN vouchers v
              ON v.voucher_id = p.voucher_id
            WHERE p.member_id = ${account.actingUserId}::uuid
              AND LOWER(TRIM(COALESCE(p.status, ''))) IN ('used', 'redeemed', 'completed')
              AND p.purchase_date >= ${new Date(year, 0, 1)}
              AND p.purchase_date < ${new Date(year + 1, 0, 1)};
          `
        : Promise.resolve([{ count: 0 }]),
      isProvider
        ? prisma.event_provider_invites.findMany({
            where: {
              provider_id: account.actingUserId,
              status: "accepted",
              events: {
                start_date: {
                  gte: new Date(year, 0, 1),
                  lt: new Date(year + 1, 0, 1),
                },
              },
            },
            select: {
              status: true,
              events: {
                select: {
                  status: true,
                  start_date: true,
                },
              },
            },
          })
        : Promise.resolve([]),
      isProvider
        ? prisma.$queryRaw<Array<{ count: number }>>`
            SELECT COUNT(*)::int AS count
            FROM purchases p
            INNER JOIN vouchers v
              ON v.voucher_id = p.voucher_id
            WHERE v.provider_id = ${account.actingUserId}::uuid
              AND LOWER(TRIM(COALESCE(p.status, ''))) IN ('used', 'redeemed', 'completed')
              AND p.purchase_date >= ${new Date(year, 0, 1)}
              AND p.purchase_date < ${new Date(year + 1, 0, 1)};
          `
        : Promise.resolve([{ count: 0 }]),
    ]);

    const sortedTiers = [...tiers];

    if (sortedTiers.length === 0) {
      return res.status(500).json({ error: "No reward tiers are configured for this user type" });
    }

    const balance = rewardAccount?.points_balance ?? 0;
    const currentTier = resolveCurrentTier(sortedTiers, balance);
    const nextTier = resolveNextTier(sortedTiers, currentTier);

    const milestones: EngagementAnalyticsMilestone[] = milestoneTasks.map((task) => {
      const completedAt = task.completions[0]?.completed_at ?? null;

      return {
        taskId: task.task_id,
        name: task.name,
        points: task.points,
        earned: Boolean(completedAt),
        completedAt: completedAt ? completedAt.toISOString() : null,
      };
    });

    let providerNetwork: EngagementAnalyticsPartnerInfo = null;
    let partnerProviders: EngagementAnalyticsProviderRanking[] = [];
    let partnerStanding: EngagementAnalyticsPartnerStanding = null;
    let partnerProviderCapacity: EngagementAnalyticsPartnerCapacity = null;

    const partnerNetworkWhere = account.actingNetworkCode
      ? { network_code: account.actingNetworkCode }
      : account.actingNetworkName
        ? { network_name: account.actingNetworkName }
        : null;

    if (partnerNetworkWhere && (account.actingUserType === "partner" || account.actingUserType === "provider")) {
      const partnerRows = await prisma.partner_profiles.findMany({
        where: {
          ...partnerNetworkWhere,
          users: {
            user_type: "partner",
          },
        },
        select: {
          user_id: true,
          org_name: true,
          users: {
            select: {
              reward_accounts: {
                where: {
                  reward_year: year,
                },
                select: {
                  points_balance: true,
                },
              },
            },
          },
        },
      });

      const rankedPartners = partnerRows
        .map((partner) => ({
          userId: partner.user_id,
          name: partner.org_name,
          points: partner.users.reward_accounts[0]?.points_balance ?? 0,
        }))
        .sort((a, b) => {
          if (b.points !== a.points) {
            return b.points - a.points;
          }

          return (a.name ?? "").localeCompare(b.name ?? "") || a.userId.localeCompare(b.userId);
        })
        .map((partner, index) => ({
          ...partner,
          rank: index + 1,
        }));

      const totalPartners = rankedPartners.length;
      const currentPartner = rankedPartners.find((partner) => partner.userId === account.actingUserId) ?? null;
      const averagePoints =
        totalPartners > 0
          ? Math.round(rankedPartners.reduce((sum, partner) => sum + partner.points, 0) / totalPartners)
          : 0;

      partnerStanding = currentPartner
        ? {
            rank: currentPartner.rank,
            totalPartners,
            averagePoints,
          }
        : null;
    }

    if (isPartner) {
      const maxProviders = partnerSubscription?.max_providers ?? null;

      partnerProviderCapacity = {
        currentProviders: partnerProviderCount,
        maxProviders,
        remainingProviders: maxProviders === null ? null : Math.max(maxProviders - partnerProviderCount, 0),
      };
    }

    if (providerProfile?.partner_id) {
      const partnerProfile = await prisma.partner_profiles.findUnique({
        where: { user_id: providerProfile.partner_id },
        select: {
          org_name: true,
          partner_code: true,
        },
      });

      providerNetwork = {
        partnerId: providerProfile.partner_id,
        partnerName: partnerProfile?.org_name ?? providerProfile.network_name ?? null,
        partnerCode: partnerProfile?.partner_code ?? providerProfile.network_code ?? null,
      };

      const partnerProviderRows = await prisma.provider_profiles.findMany({
        where: {
          partner_id: providerProfile.partner_id,
          users: {
            user_type: "provider",
          },
        },
        orderBy: [
          {
            business_name: "asc",
          },
          {
            created_at: "desc",
          },
        ],
        select: {
          business_name: true,
          users: {
            select: {
              user_id: true,
              display_id: true,
              first_name: true,
              last_name: true,
              reward_accounts: {
                where: {
                  reward_year: year,
                },
                select: {
                  points_balance: true,
                },
              },
            },
          },
        },
      });

      partnerProviders = partnerProviderRows
        .map((provider) => {
          const points = provider.users.reward_accounts[0]?.points_balance ?? 0;

          return {
            userId: provider.users.user_id,
            displayId: provider.users.display_id,
            firstName: provider.users.first_name,
            lastName: provider.users.last_name,
            businessName: provider.business_name,
            points,
          };
        })
        .sort((a, b) => {
          if (b.points !== a.points) {
            return b.points - a.points;
          }

          return (a.businessName ?? "").localeCompare(b.businessName ?? "") || a.userId.localeCompare(b.userId);
        })
        .map((provider, index) => ({
          ...provider,
          rank: index + 1,
        }));
    }

    const providerHostedCompletedEvents = providerHostedEvents.filter((invite) =>
      isCompletedHostedEvent(invite.events.status, invite.events.start_date)
    ).length;
    const memberVoucherRedeemedTotal = memberVoucherRedeemedCount[0]?.count ?? 0;
    const providerVoucherHonoredTotal = providerVoucherHonoredCount[0]?.count ?? 0;

    return res.status(200).json({
      year,
      points: {
        balance,
        tier: {
          name: currentTier.name,
          minPoints: currentTier.min_points,
          maxPoints: currentTier.max_points,
        },
        nextTier: nextTier
          ? {
              name: nextTier.name,
              minPoints: nextTier.min_points,
            }
          : null,
        pointsToNextTier: nextTier ? Math.max(0, nextTier.min_points - balance) : 0,
      },
      goals: [],
      streak: {
        currentWeeks: rewardStreak?.current_streak ?? 0,
      },
      milestones,
      partnerStanding,
      partnerProviderCapacity,
      providerNetwork,
      partnerProviders,
      memberVoucherRedeemedCount: memberVoucherRedeemedTotal,
      providerHostedCompletedEvents,
      providerVoucherHonoredCount: providerVoucherHonoredTotal,
    });
  } catch (error) {
    console.error("engagement-analytics error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch engagement analytics",
    });
  }
}
