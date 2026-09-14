import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  CheckCircle2,
  Crown,
  Flame,
  Loader2,
  Lock,
  Target,
  Ticket,
  PartyPopper,
  Users,
} from "lucide-react";
import { fetchEngagementAnalytics, type EngagementAnalyticsResponse } from "@/api/engagementAnalytics";
import { getUserFromStorage, type User } from "@/utils/userStorage";
import { UserType } from "@/types/user";

type DashboardUserType = Exclude<UserType, "admin">;

type RoleCopy = {
  description: string;
  streakDescription: string;
  milestonesDescription: string;
  milestoneHeading: string;
  milestoneIntro: string;
  roleLabel: string;
};

const ROLE_COPY: Record<DashboardUserType, RoleCopy> = {
  member: {
    description: "Track your voucher redemptions and milestone progress.",
    streakDescription: "Consecutive weeks attending events or using vouchers",
    milestonesDescription: "Earn points by attending events and redeeming vouchers",
    milestoneHeading: "Member Milestones",
    milestoneIntro: "These are the active reward tasks for members.",
    roleLabel: "Member",
  },
  provider: {
    description: "Track your hosting activity, voucher honors, and milestone progress.",
    streakDescription: "Consecutive weeks hosting events or honoring vouchers",
    milestonesDescription: "Earn points by hosting events and honoring vouchers",
    milestoneHeading: "Provider Milestones",
    milestoneIntro: "These are the active reward tasks for providers.",
    roleLabel: "Provider",
  },
  partner: {
    description: "Track your active providers, voucher redemption status, and milestone progress.",
    streakDescription: "Consecutive weeks creating events or growing your network",
    milestonesDescription: "Earn points by creating events and growing your provider network",
    milestoneHeading: "Partner Milestones",
    milestoneIntro: "These are the active reward tasks for partners.",
    roleLabel: "Partner",
  },
};

function getTierBadgeClass(tier: { minPoints: number; maxPoints: number | null }) {
  if (tier.maxPoints === null) {
    return "bg-amber-50 text-amber-800 border-amber-200";
  }

  if (tier.minPoints === 0) {
    return "bg-sky-50 text-sky-800 border-sky-200";
  }

  return "bg-slate-100 text-slate-700 border-slate-200";
}

function getTierProgressPercent(data: EngagementAnalyticsResponse) {
  const { balance, tier, nextTier } = data.points;

  if (!nextTier) {
    return 100;
  }

  const lowerBound = tier.minPoints;
  const upperBound = nextTier.minPoints;
  const span = Math.max(1, upperBound - lowerBound);
  const progress = ((balance - lowerBound) / span) * 100;

  return Math.max(0, Math.min(100, Math.round(progress)));
}

const PARTNER_PROGRESS_PLACEHOLDERS = [
  {
    icon: Ticket,
    iconBg: "bg-fuchsia-50",
    iconColor: "text-fuchsia-600",
    title: "Voucher Redemption Status",
    current: 41,
    goal: 58,
  },
] as const;

const PROVIDER_VOUCHER_HONORED_METRIC = {
  icon: Ticket,
  iconBg: "bg-primary/10",
  iconColor: "text-primary",
  title: "Vouchers Honored",
} as const;

const ScoreRing = ({
  points,
  tierName,
  roleLabel,
  tier,
  pointsToNextTier,
  nextTierName,
  progressPercent,
}: {
  points: number;
  tierName: string;
  roleLabel: string;
  tier: { minPoints: number; maxPoints: number | null };
  pointsToNextTier: number;
  nextTierName: string | null;
  progressPercent: number;
}) => {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 120 120" className="-rotate-90">
          <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="url(#scoreGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
            </linearGradient>
          </defs>
        </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">{points}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">points</span>
        </div>
      </div>
      <Badge className={`${getTierBadgeClass(tier)} px-3 py-1 text-xs`}>
        {tierName} {roleLabel}
      </Badge>
      <p className="text-center text-xs text-muted-foreground">
        {nextTierName ? (
          <span className="font-medium">{pointsToNextTier} pts</span>
        ) : (
          <span className="font-medium">Top tier reached</span>
        )}{" "}
        {nextTierName ? `to ${nextTierName}` : ""}
      </p>
    </div>
  );
};

const ProgressMetric = ({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  current,
  goal,
  helperText,
}: {
  icon: any;
  iconBg: string;
  iconColor: string;
  title: string;
  current: number;
  goal?: number | null;
  helperText?: string;
}) => (
  <div className="space-y-2.5">
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className={`shrink-0 rounded-lg p-2.5 ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <span className="truncate text-sm font-medium">{title}</span>
      </div>
      <span className="shrink-0 text-sm font-semibold">
        {current}
        {typeof goal === "number" ? (
          <span className="font-normal text-muted-foreground"> / {goal}</span>
        ) : null}
      </span>
    </div>
    {typeof goal === "number" ? (
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-pink-500 transition-all duration-500"
          style={{ width: `${goal > 0 ? Math.max(0, Math.min(100, Math.round((current / goal) * 100))) : 0}%` }}
        />
      </div>
    ) : helperText ? (
      <p className="text-xs text-muted-foreground">{helperText}</p>
    ) : null}
  </div>
);

const ProviderCapacityMetric = ({
  currentProviders,
  maxProviders,
}: {
  currentProviders: number;
  maxProviders: number | null;
}) => {
  const hasLimit = typeof maxProviders === "number";
  const progressPercent = hasLimit && maxProviders > 0
    ? Math.max(0, Math.min(100, Math.round((currentProviders / maxProviders) * 100)))
    : 0;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="shrink-0 rounded-lg bg-primary/10 p-2.5">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <span className="truncate text-sm font-medium">Active Providers</span>
        </div>
        <span className="shrink-0 text-sm font-semibold">
          {currentProviders}{" "}
          <span className="font-normal text-muted-foreground">
            / {hasLimit ? maxProviders : "unlimited"}
          </span>
        </span>
      </div>

      {hasLimit ? (
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-pink-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Your plan does not cap provider seats.</p>
      )}
    </div>
  );
};

const ProviderRankingCard = ({
  title,
  description,
  providers,
  currentUserId,
}: {
  title: string;
  description: string;
  providers: EngagementAnalyticsResponse["partnerProviders"];
  currentUserId?: string | null;
}) => {
  const sortedProviders = [...providers].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    return a.rank - b.rank;
  });

  const providerCount = sortedProviders.length;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
          {providerCount} {providerCount === 1 ? "provider" : "providers"}
        </Badge>
      </div>

      <div className="mt-4 space-y-2.5">
        {sortedProviders.length > 0 ? (
          sortedProviders.map((provider) => {
            const isCurrentProvider = provider.userId === currentUserId;
            const displayName =
              [provider.firstName, provider.lastName].filter(Boolean).join(" ").trim() ||
              provider.businessName ||
              provider.displayId ||
              "Unnamed Provider";

            return (
              <div
                key={provider.userId}
                className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  isCurrentProvider ? "border-primary/30 bg-primary/5" : "border-border bg-background"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {provider.rank}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{displayName}</p>
                      {isCurrentProvider ? (
                        <Badge className="border-primary/20 bg-primary/10 text-[10px] text-primary">You</Badge>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {provider.businessName || provider.displayId || "Provider profile"}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold">{provider.points}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">points</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
            <p className="text-sm font-medium">No provider rankings yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Once your partner has linked providers with reward activity, the ranking list will appear here.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

const MilestoneCard = ({
  milestone,
}: {
  milestone: EngagementAnalyticsResponse["milestones"][number];
}) => (
  <div
    className={`group relative rounded-xl border p-4 transition-all ${
      milestone.earned
        ? "border-primary/20 bg-primary/5 hover:border-primary/30"
        : "border-border bg-muted/20 hover:bg-muted/30"
    }`}
  >
    <div className="flex items-start gap-3">
      <div
        className={`shrink-0 rounded-lg p-2 ${
          milestone.earned ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        }`}
      >
        <Ticket className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium leading-tight ${!milestone.earned ? "text-muted-foreground" : ""}`}>
          {milestone.name}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">+{milestone.points} pts</span>
          {milestone.earned ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
              <CheckCircle2 className="h-3 w-3" />
              Earned
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              Locked
            </span>
          )}
        </div>
        {milestone.completedAt ? (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Completed{" "}
            {new Date(milestone.completedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        ) : null}
      </div>
    </div>
  </div>
);

const StreakDisplay = ({ weeks, description }: { weeks: number; description: string }) => (
  <div className="flex items-center gap-4">
    <div className="shrink-0 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 p-4">
      <Flame className="h-7 w-7 text-orange-500" />
    </div>
    <div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold">{weeks}</span>
        <span className="text-sm text-muted-foreground">week streak</span>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
);

const EngagementScorePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [analytics, setAnalytics] = useState<EngagementAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUser(getUserFromStorage());
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!user?.cognitoId) {
      setAnalytics(null);
      setError("No signed-in user found.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchEngagementAnalytics(user.cognitoId)
      .then((data) => {
        if (!cancelled) {
          setAnalytics(data);
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setAnalytics(null);
          setError(fetchError instanceof Error ? fetchError.message : "Failed to load engagement analytics");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, user?.cognitoId]);

  const role = (user?.userType && user.userType in ROLE_COPY ? user.userType : "member") as DashboardUserType;
  const copy = ROLE_COPY[role];

  const tierProgressPercent = analytics ? getTierProgressPercent(analytics) : 0;
  const providerStanding = React.useMemo(() => {
    if (role !== "provider" || !analytics) {
      return null;
    }

    const totalProviders = analytics.partnerProviders.length;
    const currentProvider = analytics.partnerProviders.find((provider) => provider.userId === user?.id);

    if (!currentProvider) {
      return null;
    }

    const averagePoints =
      totalProviders > 0
        ? Math.round(analytics.partnerProviders.reduce((sum, provider) => sum + provider.points, 0) / totalProviders)
        : 0;

    return {
      rank: currentProvider.rank,
      totalProviders,
      averagePoints,
      partnerName: analytics.providerNetwork?.partnerName ?? null,
    };
  }, [analytics, role, user?.id]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="font-barlow text-2xl font-bold text-foreground sm:text-3xl">Engagement Score</h1>
          <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
        </div>

        {error ? (
          <Card className="border-destructive/30 bg-destructive/5 p-5">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </Card>
        ) : null}

        {loading || !analytics ? (
          <Card className="p-8">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading engagement analytics...
            </div>
          </Card>
        ) : (
          <>
            {role === "provider" ? (
              <>
                <Card className="p-6">
                  <div className="flex flex-col items-center gap-8 md:flex-row">
                    <ScoreRing
                      points={analytics.points.balance}
                      tierName={analytics.points.tier.name}
                      roleLabel={copy.roleLabel}
                      tier={analytics.points.tier}
                      pointsToNextTier={analytics.points.pointsToNextTier}
                      nextTierName={analytics.points.nextTier?.name ?? null}
                      progressPercent={tierProgressPercent}
                    />

                    <div className="w-full flex-1 space-y-5">
                      <ProgressMetric
                        icon={PROVIDER_VOUCHER_HONORED_METRIC.icon}
                        iconBg={PROVIDER_VOUCHER_HONORED_METRIC.iconBg}
                        iconColor={PROVIDER_VOUCHER_HONORED_METRIC.iconColor}
                        title={PROVIDER_VOUCHER_HONORED_METRIC.title}
                        current={analytics.providerVoucherHonoredCount}
                      />
                      <ProgressMetric
                        icon={PartyPopper}
                        iconBg="bg-blue-50"
                        iconColor="text-blue-600"
                        title="Events Hosted"
                        current={analytics.providerHostedCompletedEvents}
                      />
                      <div className="pt-1">
                        <StreakDisplay
                          weeks={analytics.streak.currentWeeks}
                          description={copy.streakDescription}
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2.5">
                      <Crown className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Tier Standing - {analytics.points.tier.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {providerStanding
                          ? `Rank #${providerStanding.rank} of ${providerStanding.totalProviders} providers${providerStanding.partnerName ? ` under ${providerStanding.partnerName}` : ""} · Average score: ${providerStanding.averagePoints}`
                          : "Rank and average score will populate once provider comparison data is available."}
                      </p>
                    </div>
                  </div>
                </Card>

                <ProviderRankingCard
                  title={`Peer Comparison - ${analytics.points.tier.name} Tier`}
                  description={
                    analytics.providerNetwork?.partnerName
                      ? `Providers linked to ${analytics.providerNetwork.partnerName} are ordered by current-year points.`
                      : "Providers linked to your partner are ordered by current-year points."
                  }
                  providers={analytics.partnerProviders}
                  currentUserId={user?.id}
                />
              </>
            ) : role === "partner" ? (
              <>
                <Card className="p-6">
                  <div className="flex flex-col items-center gap-8 md:flex-row">
                    <ScoreRing
                      points={analytics.points.balance}
                      tierName={analytics.points.tier.name}
                      roleLabel={copy.roleLabel}
                      tier={analytics.points.tier}
                      pointsToNextTier={analytics.points.pointsToNextTier}
                      nextTierName={analytics.points.nextTier?.name ?? null}
                      progressPercent={tierProgressPercent}
                    />

                    <div className="w-full flex-1 space-y-5">
                       <ProviderCapacityMetric
                        currentProviders={analytics.partnerProviderCapacity?.currentProviders ?? analytics.partnerProviders.length}
                        maxProviders={analytics.partnerProviderCapacity?.maxProviders ?? null}
                      />
                      {PARTNER_PROGRESS_PLACEHOLDERS.map((metric) => (
                        <ProgressMetric
                          key={metric.title}
                          icon={metric.icon}
                          iconBg={metric.iconBg}
                          iconColor={metric.iconColor}
                          title={metric.title}
                          current={metric.current}
                          goal={metric.goal}
                        />
                      ))}
                      <div className="pt-1">
                        <StreakDisplay
                          weeks={analytics.streak.currentWeeks}
                          description={copy.streakDescription}
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2.5">
                      <Crown className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Tier Standing - {analytics.points.tier.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {analytics.partnerStanding
                          ? `Rank #${analytics.partnerStanding.rank} of ${analytics.partnerStanding.totalPartners} partners · Average score: ${analytics.partnerStanding.averagePoints}`
                          : "Rank and average score will populate once partner comparison data is available."}
                      </p>
                    </div>
                  </div>
                </Card>

                <ProviderRankingCard
                  title="Provider Rankings"
                  description={
                    analytics.providerNetwork?.partnerName
                      ? `Providers linked to ${analytics.providerNetwork.partnerName} are ordered by current-year points.`
                      : "Providers linked to your network are ordered by current-year points."
                  }
                  providers={analytics.partnerProviders}
                  currentUserId={user?.id}
                />
              </>
            ) : (
              <>
                <Card className="p-6">
                  <div className="flex flex-col items-center gap-8 md:flex-row">
                    <ScoreRing
                      points={analytics.points.balance}
                      tierName={analytics.points.tier.name}
                      roleLabel={copy.roleLabel}
                      tier={analytics.points.tier}
                      pointsToNextTier={analytics.points.pointsToNextTier}
                      nextTierName={analytics.points.nextTier?.name ?? null}
                      progressPercent={tierProgressPercent}
                    />

                    <div className="w-full flex-1 space-y-5">
                      <ProgressMetric
                        icon={Ticket}
                        iconBg="bg-primary/10"
                        iconColor="text-primary"
                        title="Vouchers Redeemed"
                        current={analytics.memberVoucherRedeemedCount}
                      />
                      <ProgressMetric
                        icon={Users}
                        iconBg="bg-green-50"
                        iconColor="text-green-600"
                        title="Active Networks"
                        current={analytics.memberActiveNetworkCount}
                      />
                    </div>
                  </div>
                </Card>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Card className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 p-4 shrink-0">
                        <Flame className="h-7 w-7 text-orange-500" />
                      </div>
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-bold">{analytics.streak.currentWeeks}</span>
                          <span className="text-sm text-muted-foreground">week streak</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{copy.streakDescription}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="rounded-xl bg-primary/10 p-4 shrink-0">
                        <Target className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Next Goal</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {analytics.points.nextTier
                            ? `Earn ${analytics.points.pointsToNextTier} more points to reach ${analytics.points.nextTier.name}.`
                            : "Your next goal is to keep your streak alive and maintain your current tier."}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </>
            )}

            <div>
              <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
                <Award className="h-5 w-5 text-primary" /> {copy.milestoneHeading}
              </h2>
              <p className="mb-4 text-xs text-muted-foreground">{copy.milestoneIntro}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {analytics.milestones.map((milestone) => (
                  <MilestoneCard key={milestone.taskId} milestone={milestone} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EngagementScorePage;
