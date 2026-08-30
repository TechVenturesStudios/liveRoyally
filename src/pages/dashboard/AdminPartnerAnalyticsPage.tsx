
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ViewToggle from "@/components/ui/ViewToggle";
import EventDetailDialog from "@/components/ui/EventDetailDialog";
import { Users, Clock, Building, CalendarDays, BarChart3, Globe, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { fetchAdminAnalytics, type AdminAnalyticsNetwork, type AdminAnalyticsPartner } from "@/api/adminAnalytics";
import { getUserFromStorage } from "@/utils/userStorage";

type PartnerAnalytics = AdminAnalyticsPartner;

type NetworkData = AdminAnalyticsNetwork;

const planColors: Record<string, string> = {
  Free: "bg-muted text-muted-foreground",
  Starter: "bg-blue-100 text-blue-700",
  Growth: "bg-green-100 text-green-700",
  Enterprise: "bg-purple-100 text-purple-700",
};
const planOrder: Record<string, number> = { Enterprise: 0, Growth: 1, Starter: 2, Free: 3 };

const AdminPartnerAnalyticsPage = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuthCheck();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedPartner, setSelectedPartner] = useState<PartnerAnalytics | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkData | null>(null);
  const [sortKey, setSortKey] = useState<keyof PartnerAnalytics | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [pendingPartnerCount, setPendingPartnerCount] = useState<number | null>(null);
  const [partnerAnalytics, setPartnerAnalytics] = useState<PartnerAnalytics[]>([]);
  const [networkMembers, setNetworkMembers] = useState<NetworkData[]>([]);
  const [totalMembers, setTotalMembers] = useState<number | null>(null);
  const [totalProviders, setTotalProviders] = useState<number | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadAnalytics = async () => {
      try {
        const result = await fetchAdminAnalytics(getUserFromStorage()?.cognitoId);

        if (!cancelled) {
          setPendingPartnerCount(result.totals.pendingPartners);
          setPartnerAnalytics(result.partners);
          setNetworkMembers(result.networks);
          setTotalMembers(result.totals.members);
          setTotalProviders(result.totals.providers);
        }
      } catch (error) {
        if (!cancelled) {
          setAnalyticsError(error instanceof Error ? error.message : "Failed to load analytics");
        }
      } finally {
        if (!cancelled) setAnalyticsLoading(false);
      }
    };

    if (!isLoading && user) loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [isLoading, user]);

  

  const totals = partnerAnalytics.reduce(
    (acc, p) => ({
      partners: acc.partners + 1,
      published: acc.published + p.publishedEvents,
      pending: acc.pending + p.pendingEvents,
      providers: acc.providers + p.totalProviders,
    }),
    { partners: 0, published: 0, pending: 0, providers: 0 }
  );

  const handleSort = (key: keyof PartnerAnalytics) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedPartners = useMemo(() => {
    if (!sortKey) return partnerAnalytics;
    return [...partnerAnalytics].sort((a, b) => {
      if (sortKey === "plan") {
        const diff = planOrder[a.plan] - planOrder[b.plan];
        return sortDir === "asc" ? diff : -diff;
      }
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [partnerAnalytics, sortKey, sortDir]);

  const SortIcon = ({ column }: { column: keyof PartnerAnalytics }) => {
    if (sortKey !== column) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  if (isLoading || analyticsLoading) return <LoadingSpinner />;

  const systemCards = [
    { label: "Total Partners", value: totals.partners, icon: Building, color: "text-purple-600 bg-purple-100", path: "/dashboard/admin/partners" },
    { label: "Total Providers", value: totalProviders ?? totals.providers, icon: Users, color: "text-blue-600 bg-blue-100", path: "/dashboard/admin/providers" },
    { label: "Total Members", value: totalMembers ?? 0, icon: Globe, color: "text-cyan-600 bg-cyan-100", path: "/dashboard/admin/members" },
    { label: "Pending Partners", value: pendingPartnerCount === null ? "..." : pendingPartnerCount, icon: Clock, color: "text-amber-600 bg-amber-100", path: "/dashboard/admin/pending-partners" },
  ];

  const getPartnerDetailRows = (p: PartnerAnalytics) => [
    { label: "Organization", value: p.organizationName },
    { label: "Category", value: p.organizationCategory },
    { label: "Location", value: `${p.city}, ${p.state}` },
    { label: "Plan", value: <Badge className={planColors[p.plan]}>{p.plan}</Badge> },
    { label: "Join Date", value: new Date(p.joinDate).toLocaleDateString() },
    { label: "Published Events", value: String(p.publishedEvents) },
    { label: "Pending Events", value: String(p.pendingEvents) },
    { label: "Total Providers", value: String(p.totalProviders) },
  ];

  const getNetworkDetailRows = (n: NetworkData) => [
    { label: "Network Name", value: n.network },
    { label: "Network Code", value: n.code },
    { label: "Active Members", value: String(n.activeMembers) },
    { label: "Total Members", value: String(n.totalMembers) },
    { label: "Activity Rate", value: `${n.totalMembers ? Math.round((n.activeMembers / n.totalMembers) * 100) : 0}%` },
    { label: "Top Partner", value: n.topPartner },
    { label: "Total Providers", value: String(n.totalProviders) },
    { label: "Total Events", value: String(n.totalEvents) },
    { label: "Launch Date", value: new Date(n.launchDate).toLocaleDateString() },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {analyticsError && (
          <Card><div className="py-4 px-5 text-sm text-destructive">{analyticsError}</div></Card>
        )}
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-barlow font-bold text-2xl sm:text-3xl text-foreground mb-1">
              Network Analytics
            </h1>
            <p className="text-sm text-muted-foreground">
              System-wide overview of partners, providers, and member activity
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1 border-primary/30 bg-primary/5">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium text-primary">{(totalMembers ?? 0) + totals.partners + (totalProviders ?? totals.providers)} total users</span>
            </Badge>
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>
        </div>

        {/* System-Wide Summary Cards — clickable, navigate to pages */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {systemCards.map((card) => (
            <Card
              key={card.label}
              className="p-4 cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigate(card.path, { state: { from: "/dashboard/admin/analytics" } })}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-barlow font-bold mt-1">{card.value}</p>
                </div>
                <div className={`rounded-full p-2 ${card.color}`}>
                  <card.icon className="h-4 w-4" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Members by Network — clickable, opens popup */}
        <div>
          <h2 className="font-barlow font-bold text-lg mb-3">Members by Network</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {networkMembers.map((n) => (
              <Card
                key={n.code}
                className="p-4 cursor-pointer hover:shadow-md transition-all min-w-[280px] flex-shrink-0"
                onClick={() => setSelectedNetwork(n)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-barlow font-bold text-base">{n.network}</h3>
                    <p className="text-xs text-muted-foreground">{n.code}</p>
                  </div>
                  <div className="rounded-full p-2 bg-cyan-100 text-cyan-600">
                    <Globe className="h-4 w-4" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center mt-2">
                  <div>
                    <p className="text-lg font-bold">{n.activeMembers}</p>
                    <p className="text-[11px] text-muted-foreground">Active</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{n.totalMembers}</p>
                    <p className="text-[11px] text-muted-foreground">Total</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Activity rate</span>
                    <span>{n.totalMembers ? Math.round((n.activeMembers / n.totalMembers) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${n.totalMembers ? (n.activeMembers / n.totalMembers) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Partner Breakdown */}
        <h2 className="font-barlow font-bold text-lg">Partner Breakdown</h2>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partnerAnalytics.map((p) => (
              <Card
                key={p.id}
                className="p-4 cursor-pointer hover:shadow-md transition-all"
                onClick={() => setSelectedPartner(p)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-barlow font-bold text-base">{p.organizationName}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.organizationCategory}</p>
                  </div>
                  <Badge className={`text-xs ${planColors[p.plan]}`}>{p.plan}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center mt-4">
                  <div>
                    <p className="text-lg font-bold">{p.publishedEvents}</p>
                    <p className="text-[11px] text-muted-foreground">Published</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{p.pendingEvents}</p>
                    <p className="text-[11px] text-muted-foreground">Pending</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{p.totalProviders}</p>
                    <p className="text-[11px] text-muted-foreground">Providers</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>Joined {new Date(p.joinDate).toLocaleDateString()}</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("organizationName")}>
                    <span className="flex items-center">Organization <SortIcon column="organizationName" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("organizationCategory")}>
                    <span className="flex items-center">Category <SortIcon column="organizationCategory" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("plan")}>
                    <span className="flex items-center">Plan <SortIcon column="plan" /></span>
                  </TableHead>
                  <TableHead className="text-center cursor-pointer select-none" onClick={() => handleSort("publishedEvents")}>
                    <span className="flex items-center justify-center">Published <SortIcon column="publishedEvents" /></span>
                  </TableHead>
                  <TableHead className="text-center cursor-pointer select-none" onClick={() => handleSort("pendingEvents")}>
                    <span className="flex items-center justify-center">Pending <SortIcon column="pendingEvents" /></span>
                  </TableHead>
                  <TableHead className="text-center cursor-pointer select-none" onClick={() => handleSort("totalProviders")}>
                    <span className="flex items-center justify-center">Providers <SortIcon column="totalProviders" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("joinDate")}>
                    <span className="flex items-center">Joined <SortIcon column="joinDate" /></span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPartners.map((p) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedPartner(p)}
                  >
                    <TableCell className="font-medium">{p.organizationName}</TableCell>
                    <TableCell className="text-muted-foreground">{p.organizationCategory}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${planColors[p.plan]}`}>{p.plan}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{p.publishedEvents}</TableCell>
                    <TableCell className="text-center font-medium">{p.pendingEvents}</TableCell>
                    <TableCell className="text-center font-medium">{p.totalProviders}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(p.joinDate).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Partner Detail Dialog */}
        {selectedPartner && (
          <EventDetailDialog
            open={!!selectedPartner}
            onOpenChange={() => setSelectedPartner(null)}
            title={selectedPartner.organizationName}
            description={selectedPartner.organizationCategory}
            rows={getPartnerDetailRows(selectedPartner)}
          />
        )}

        {/* Network Detail Dialog */}
        {selectedNetwork && (
          <EventDetailDialog
            open={!!selectedNetwork}
            onOpenChange={() => setSelectedNetwork(null)}
            title={selectedNetwork.network}
            description={`Network Code: ${selectedNetwork.code}`}
            rows={getNetworkDetailRows(selectedNetwork)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminPartnerAnalyticsPage;
