import { buildDashboardQuery } from "@/utils/dashboardContext";

export type EngagementAnalyticsMilestone = {
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

export type EngagementAnalyticsResponse = {
  year: number;
  points: {
    balance: number;
    tier: {
      name: string;
      minPoints: number;
      maxPoints: number | null;
    };
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
};

async function readJsonOrThrow(response: Response, fallbackMessage: string) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || fallbackMessage);
  }

  return data;
}

export async function fetchEngagementAnalytics(cognitoId?: string) {
  const response = await fetch(`/api/engagement-analytics${buildDashboardQuery(cognitoId)}`, {
    credentials: "include",
  });

  return (await readJsonOrThrow(
    response,
    "Failed to fetch engagement analytics"
  )) as EngagementAnalyticsResponse;
}
