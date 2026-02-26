
import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Medal, Ticket, Users, TrendingUp, Award, Target, CalendarPlus,
  CalendarCheck, PartyPopper, Crown, Flame, Star, Zap, Trophy,
  CheckCircle2, Lock, ChevronRight,
} from "lucide-react";
import { getUserFromStorage } from "@/utils/userStorage";
import { UserType } from "@/types/user";

// ── helpers ──────────────────────────────────────────────────────
const getLevelColor = (level: string) => {
  switch (level) {
    case "Bronze": return "bg-orange-100 text-orange-800 border-orange-200";
    case "Silver": return "bg-gray-100 text-gray-700 border-gray-200";
    case "Gold":   return "bg-yellow-50 text-yellow-800 border-yellow-200";
    case "Platinum": return "bg-purple-50 text-purple-800 border-purple-200";
    default: return "bg-muted text-muted-foreground";
  }
};

const getLevelGradient = (level: string) => {
  switch (level) {
    case "Bronze": return "from-orange-400 to-orange-600";
    case "Silver": return "from-gray-400 to-gray-600";
    case "Gold":   return "from-yellow-400 to-amber-500";
    case "Platinum": return "from-purple-400 to-purple-600";
    default: return "from-primary to-primary";
  }
};

// ── Shared Components ────────────────────────────────────────────

const ScoreRing = ({ score, level, label, pointsToNext, nextLevel }: {
  score: number; level: string; label: string; pointsToNext: number; nextLevel: string;
}) => {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 120 120" className="-rotate-90">
          <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
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
          <span className="text-3xl font-bold">{score}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">points</span>
        </div>
      </div>
      <Badge className={`${getLevelColor(level)} text-xs px-3 py-1`}>
        {level} {label}
      </Badge>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium">{pointsToNext} pts</span> to {nextLevel}
      </p>
    </div>
  );
};

const ProgressMetric = ({ icon: Icon, iconBg, iconColor, title, current, goal, unit }: {
  icon: any; iconBg: string; iconColor: string; title: string; current: number; goal: number; unit?: string;
}) => {
  const pct = goal > 0 ? Math.round((current / goal) * 100) : 0;
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`rounded-lg p-2 ${iconBg}`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <span className="text-sm font-medium">{title}</span>
        </div>
        <span className="text-sm font-semibold">{current}{unit ? ` ${unit}` : ""} <span className="text-muted-foreground font-normal">/ {goal}</span></span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
};

const MilestoneCard = ({ label, completed, points, icon: Icon }: {
  label: string; completed: boolean; points: number; icon: any;
}) => (
  <div className={`group relative p-4 rounded-xl border transition-all ${
    completed
      ? "bg-primary/5 border-primary/20 hover:border-primary/30"
      : "bg-muted/20 border-border hover:bg-muted/30"
  }`}>
    <div className="flex items-start gap-3">
      <div className={`rounded-lg p-2 shrink-0 ${
        completed ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      }`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-tight ${!completed ? "text-muted-foreground" : ""}`}>
          {label}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs text-muted-foreground">+{points} pts</span>
          {completed ? (
            <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
              <CheckCircle2 className="h-3 w-3" /> Earned
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" /> Locked
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

const StreakDisplay = ({ weeks, description }: { weeks: number; description: string }) => (
  <div className="flex items-center gap-4">
    <div className="rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 p-4 shrink-0">
      <Flame className="h-7 w-7 text-orange-500" />
    </div>
    <div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold">{weeks}</span>
        <span className="text-sm text-muted-foreground">week streak</span>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  </div>
);

// ── mock data per role ───────────────────────────────────────────

// PARTNER data
const partnerData = {
  overallScore: 82, level: "Gold", nextLevel: "Platinum", pointsToNext: 18,
  activeProviders: 12, providerGoal: 15, vouchersCreated: 58, vouchersUsed: 41,
  streakWeeks: 8,
  providerActivity: [
    { name: "Sunrise Health Clinic", score: 94, tier: "Growth", events: 12, vouchersUsed: 18 },
    { name: "Green Valley Nutrition", score: 87, tier: "Growth", events: 9, vouchersUsed: 14 },
    { name: "Mindful Therapy Group", score: 76, tier: "Starter", events: 7, vouchersUsed: 8 },
    { name: "Family First Pediatrics", score: 68, tier: "Growth", events: 5, vouchersUsed: 6 },
    { name: "City Wellness Center", score: 55, tier: "Starter", events: 3, vouchersUsed: 3 },
  ],
  tierComparison: { tierName: "Growth", yourRank: 3, totalInTier: 18, avgScore: 65 },
};

const partnerMilestones = [
  { label: "Created First Event", completed: true, points: 5, icon: CalendarPlus },
  { label: "5 Events Created", completed: true, points: 10, icon: CalendarPlus },
  { label: "10 Providers in Network", completed: true, points: 15, icon: Users },
  { label: "50 Vouchers Created", completed: true, points: 20, icon: Ticket },
  { label: "75% Voucher Redemption Rate", completed: false, points: 25, icon: Target },
  { label: "20 Events Created", completed: false, points: 30, icon: CalendarPlus },
];

// PROVIDER data
const providerData = {
  overallScore: 76, level: "Silver", nextLevel: "Gold", pointsToNext: 24,
  eventsHosted: 9, eventGoal: 15, vouchersHonored: 32, voucherGoal: 50,
  streakWeeks: 5,
  tierComparison: { tierName: "Growth", yourRank: 5, totalInTier: 22, avgScore: 62 },
  peerRanking: [
    { name: "You", score: 76, highlight: true },
    { name: "Sunrise Health Clinic", score: 94, highlight: false },
    { name: "Green Valley Nutrition", score: 87, highlight: false },
    { name: "City Wellness Center", score: 55, highlight: false },
    { name: "Metro Fitness Hub", score: 48, highlight: false },
  ],
};

const providerMilestones = [
  { label: "Hosted First Event", completed: true, points: 5, icon: CalendarCheck },
  { label: "5 Events Hosted", completed: true, points: 10, icon: CalendarCheck },
  { label: "Honored 25 Vouchers", completed: true, points: 15, icon: Ticket },
  { label: "4-Week Activity Streak", completed: true, points: 10, icon: Flame },
  { label: "Honored 50 Vouchers", completed: false, points: 25, icon: Ticket },
  { label: "15 Events Hosted", completed: false, points: 30, icon: CalendarCheck },
];

// MEMBER data
const memberData = {
  overallScore: 72, level: "Gold", nextLevel: "Platinum", pointsToNext: 28,
  vouchersRedeemed: 14, voucherGoal: 20, eventsAttended: 8, eventGoal: 12,
  activeNetworks: 3, networkGoal: 5, streakWeeks: 6,
};

const memberMilestones = [
  { label: "First Voucher Redeemed", completed: true, points: 5, icon: Ticket },
  { label: "Attended First Event", completed: true, points: 5, icon: PartyPopper },
  { label: "5 Events Attended", completed: true, points: 10, icon: PartyPopper },
  { label: "10 Vouchers Redeemed", completed: true, points: 15, icon: Ticket },
  { label: "12 Events Attended", completed: false, points: 20, icon: PartyPopper },
  { label: "20 Vouchers Redeemed", completed: false, points: 25, icon: Ticket },
];

// ── Leaderboard Row ──────────────────────────────────────────────
const LeaderboardRow = ({ rank, name, score, subtitle, isYou }: {
  rank: number; name: string; score: number; subtitle?: string; isYou?: boolean;
}) => {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
      isYou ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50"
    }`}>
      <span className="w-8 text-center text-lg shrink-0">
        {rank <= 3 ? medals[rank - 1] : <span className="text-sm text-muted-foreground font-medium">#{rank}</span>}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isYou ? "text-primary" : ""}`}>
          {name} {isYou && <Badge variant="secondary" className="ml-1 text-[10px] py-0">You</Badge>}
        </p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-bold">{score}</span>
        <div className="w-16">
          <Progress value={score} className="h-1.5" />
        </div>
      </div>
    </div>
  );
};

// ── Component ────────────────────────────────────────────────────

const EngagementScorePage = () => {
  const user = getUserFromStorage();
  const role: UserType = user?.userType || "member";

  // ── PARTNER VIEW ───────────────────────────────────────────────
  if (role === "partner") {
    const d = partnerData;
    const voucherRate = d.vouchersCreated > 0 ? Math.round((d.vouchersUsed / d.vouchersCreated) * 100) : 0;
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-5xl mx-auto">
          <div>
            <h1 className="font-barlow font-bold text-2xl sm:text-3xl text-foreground">Engagement Score</h1>
            <p className="text-sm text-muted-foreground mt-1">Track your network's performance and provider activity</p>
          </div>

          {/* Hero: Score + Metrics side by side */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <ScoreRing score={d.overallScore} level={d.level} label="Partner" pointsToNext={d.pointsToNext} nextLevel={d.nextLevel} />
              <div className="flex-1 w-full space-y-5">
                <ProgressMetric icon={Users} iconBg="bg-primary/10" iconColor="text-primary" title="Active Providers" current={d.activeProviders} goal={d.providerGoal} />
                <ProgressMetric icon={Ticket} iconBg="bg-green-50" iconColor="text-green-600" title="Voucher Redemption" current={d.vouchersUsed} goal={d.vouchersCreated} unit="used" />
                <div className="pt-1">
                  <StreakDisplay weeks={d.streakWeeks} description="Consecutive weeks with network activity" />
                </div>
              </div>
            </div>
          </Card>

          {/* Tier Standing */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Tier Standing — {d.tierComparison.tierName}</p>
                  <p className="text-xs text-muted-foreground">
                    Rank <strong>#{d.tierComparison.yourRank}</strong> of {d.tierComparison.totalInTier} partners · Average score: {d.tierComparison.avgScore}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Provider Activity Leaderboard */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Provider Leaderboard
            </h2>
            <div className="space-y-1">
              {d.providerActivity
                .sort((a, b) => b.score - a.score)
                .map((provider, i) => (
                  <LeaderboardRow
                    key={i}
                    rank={i + 1}
                    name={provider.name}
                    score={provider.score}
                    subtitle={`${provider.events} events · ${provider.vouchersUsed} vouchers · ${provider.tier}`}
                  />
                ))}
            </div>
          </Card>

          {/* Milestones */}
          <div>
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" /> Partner Milestones
            </h2>
            <p className="text-xs text-muted-foreground mb-4">Earn points by creating events and growing your provider network</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {partnerMilestones.map((m, i) => (
                <MilestoneCard key={i} {...m} />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── PROVIDER VIEW ──────────────────────────────────────────────
  if (role === "provider") {
    const d = providerData;
    const sorted = [...d.peerRanking].sort((a, b) => b.score - a.score);
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-5xl mx-auto">
          <div>
            <h1 className="font-barlow font-bold text-2xl sm:text-3xl text-foreground">Engagement Score</h1>
            <p className="text-sm text-muted-foreground mt-1">Track your hosting performance and compare with peers</p>
          </div>

          {/* Hero: Score + Metrics */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <ScoreRing score={d.overallScore} level={d.level} label="Provider" pointsToNext={d.pointsToNext} nextLevel={d.nextLevel} />
              <div className="flex-1 w-full space-y-5">
                <ProgressMetric icon={CalendarCheck} iconBg="bg-primary/10" iconColor="text-primary" title="Events Hosted" current={d.eventsHosted} goal={d.eventGoal} />
                <ProgressMetric icon={Ticket} iconBg="bg-green-50" iconColor="text-green-600" title="Vouchers Honored" current={d.vouchersHonored} goal={d.voucherGoal} />
                <div className="pt-1">
                  <StreakDisplay weeks={d.streakWeeks} description="Consecutive weeks hosting or honoring vouchers" />
                </div>
              </div>
            </div>
          </Card>

          {/* Tier Standing */}
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Tier Standing — {d.tierComparison.tierName}</p>
                <p className="text-xs text-muted-foreground">
                  Rank <strong>#{d.tierComparison.yourRank}</strong> of {d.tierComparison.totalInTier} providers · Average score: {d.tierComparison.avgScore}
                </p>
              </div>
            </div>
          </Card>

          {/* Peer Comparison */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" /> Peer Comparison — {d.tierComparison.tierName} Tier
            </h2>
            <div className="space-y-1">
              {sorted.map((peer, i) => (
                <LeaderboardRow
                  key={i}
                  rank={i + 1}
                  name={peer.name}
                  score={peer.score}
                  isYou={peer.highlight}
                />
              ))}
            </div>
          </Card>

          {/* Milestones */}
          <div>
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" /> Provider Milestones
            </h2>
            <p className="text-xs text-muted-foreground mb-4">Earn points by hosting events and honoring vouchers</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {providerMilestones.map((m, i) => (
                <MilestoneCard key={i} {...m} />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── MEMBER VIEW (default) ──────────────────────────────────────
  const d = memberData;
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="font-barlow font-bold text-2xl sm:text-3xl text-foreground">Engagement Score</h1>
          <p className="text-sm text-muted-foreground mt-1">Your score is based on event participation and voucher redemptions</p>
        </div>

        {/* Hero: Score + Metrics */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <ScoreRing score={d.overallScore} level={d.level} label="Member" pointsToNext={d.pointsToNext} nextLevel={d.nextLevel} />
            <div className="flex-1 w-full space-y-5">
              <ProgressMetric icon={Ticket} iconBg="bg-primary/10" iconColor="text-primary" title="Vouchers Redeemed" current={d.vouchersRedeemed} goal={d.voucherGoal} />
              <ProgressMetric icon={PartyPopper} iconBg="bg-blue-50" iconColor="text-blue-600" title="Events Attended" current={d.eventsAttended} goal={d.eventGoal} />
              <ProgressMetric icon={Users} iconBg="bg-green-50" iconColor="text-green-600" title="Active Networks" current={d.activeNetworks} goal={d.networkGoal} />
            </div>
          </div>
        </Card>

        {/* Streak + Next Goal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-5">
            <StreakDisplay weeks={d.streakWeeks} description="Consecutive weeks attending events or using vouchers" />
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-primary/10 p-4 shrink-0">
                <Target className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Next Goal</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Attend {d.eventGoal - d.eventsAttended} more events to reach {d.nextLevel}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Milestones */}
        <div>
          <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" /> Member Milestones
          </h2>
          <p className="text-xs text-muted-foreground mb-4">Earn points by attending events and redeeming vouchers</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {memberMilestones.map((m, i) => (
              <MilestoneCard key={i} {...m} />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EngagementScorePage;
