
import React, { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ViewToggle from "@/components/ui/ViewToggle";
import EventDetailDialog from "@/components/ui/EventDetailDialog";
import { ArrowLeft, Building, Users, CalendarDays, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface PartnerEntry {
  id: string;
  organizationName: string;
  organizationCategory: string;
  agentFirstName: string;
  agentLastName: string;
  organizationEmail: string;
  organizationPhone: string;
  organizationCity: string;
  organizationState: string;
  plan: string;
  joinDate: string;
  publishedEvents: number;
  pendingEvents: number;
  totalProviders: number;
}

const mockPartners: PartnerEntry[] = [
  { id: "PTR001", organizationName: "City Community Foundation", organizationCategory: "Nonprofit", agentFirstName: "John", agentLastName: "Smith", organizationEmail: "info@citycf.org", organizationPhone: "555-100-0001", organizationCity: "Metropolis", organizationState: "NY", plan: "Growth", joinDate: "2024-06-15", publishedEvents: 12, pendingEvents: 2, totalProviders: 8 },
  { id: "PTR002", organizationName: "Downtown Business Alliance", organizationCategory: "Business Association", agentFirstName: "Emma", agentLastName: "Johnson", organizationEmail: "info@downtownba.org", organizationPhone: "555-100-0002", organizationCity: "Springfield", organizationState: "IL", plan: "Enterprise", joinDate: "2024-03-10", publishedEvents: 24, pendingEvents: 3, totalProviders: 15 },
  { id: "PTR003", organizationName: "Heritage Arts Council", organizationCategory: "Arts & Culture", agentFirstName: "Linda", agentLastName: "Nguyen", organizationEmail: "hello@heritagearts.org", organizationPhone: "555-100-0003", organizationCity: "Fitsville", organizationState: "CA", plan: "Starter", joinDate: "2025-01-20", publishedEvents: 4, pendingEvents: 1, totalProviders: 3 },
  { id: "PTR004", organizationName: "Westside Community Foundation", organizationCategory: "Nonprofit", agentFirstName: "James", agentLastName: "Lee", organizationEmail: "contact@westsidecf.org", organizationPhone: "555-100-0004", organizationCity: "Lakewood", organizationState: "OH", plan: "Growth", joinDate: "2024-09-05", publishedEvents: 9, pendingEvents: 0, totalProviders: 6 },
  { id: "PTR005", organizationName: "Riverfront Chamber of Commerce", organizationCategory: "Business Association", agentFirstName: "Maria", agentLastName: "Garcia", organizationEmail: "info@riverfrontcc.org", organizationPhone: "555-100-0005", organizationCity: "Portland", organizationState: "OR", plan: "Free", joinDate: "2025-02-01", publishedEvents: 1, pendingEvents: 2, totalProviders: 2 },
];

const planColors: Record<string, string> = {
  Free: "bg-muted text-muted-foreground",
  Starter: "bg-blue-100 text-blue-700",
  Growth: "bg-green-100 text-green-700",
  Enterprise: "bg-purple-100 text-purple-700",
};

const planOrder: Record<string, number> = { Enterprise: 0, Growth: 1, Starter: 2, Free: 3 };

const AdminPartnersListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || "/dashboard/admin/analytics";
  const backLabel = from.includes("analytics") ? "Back to Analytics" : "Back to Home";
  const { isLoading } = useAuthCheck();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedPartner, setSelectedPartner] = useState<PartnerEntry | null>(null);
  const [sortKey, setSortKey] = useState<keyof PartnerEntry | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: keyof PartnerEntry) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedPartners = useMemo(() => {
    if (!sortKey) return mockPartners;
    return [...mockPartners].sort((a, b) => {
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
  }, [sortKey, sortDir]);

  const SortIcon = ({ column }: { column: keyof PartnerEntry }) => {
    if (sortKey !== column) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  if (isLoading) return <LoadingSpinner />;

  const getDetailRows = (p: PartnerEntry) => [
    { label: "Organization", value: p.organizationName },
    { label: "Category", value: p.organizationCategory },
    { label: "Contact", value: `${p.agentFirstName} ${p.agentLastName}` },
    { label: "Email", value: p.organizationEmail },
    { label: "Phone", value: p.organizationPhone },
    { label: "Location", value: `${p.organizationCity}, ${p.organizationState}` },
    { label: "Plan", value: <Badge className={planColors[p.plan]}>{p.plan}</Badge> },
    { label: "Published Events", value: String(p.publishedEvents) },
    { label: "Pending Events", value: String(p.pendingEvents) },
    { label: "Total Providers", value: String(p.totalProviders) },
    { label: "Join Date", value: new Date(p.joinDate).toLocaleDateString() },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2 h-7 text-xs"
          onClick={() => navigate(from)}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-barlow font-bold text-2xl sm:text-3xl text-foreground mb-1">All Partners</h1>
            <p className="text-sm text-muted-foreground">Platform-wide partner directory</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 border border-purple-100">
              <Building className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">{mockPartners.length} partners</span>
            </div>
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedPartners.map((p) => (
              <Card key={p.id} className="flex flex-col cursor-pointer hover:shadow-md transition-all" onClick={() => setSelectedPartner(p)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base font-semibold truncate">{p.organizationName}</CardTitle>
                      <CardDescription className="mt-1">{p.organizationCategory}</CardDescription>
                    </div>
                    <Badge className={`text-[10px] shrink-0 ${planColors[p.plan]}`}>{p.plan}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Contact</span>
                      <span className="text-foreground text-xs">{p.agentFirstName} {p.agentLastName}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Location</span>
                      <span className="text-foreground text-xs">{p.organizationCity}, {p.organizationState}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Email</span>
                      <span className="text-foreground text-xs truncate block">{p.organizationEmail}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Providers</span>
                      <span className="text-foreground text-xs">{p.totalProviders}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center pt-2 border-t">
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
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>Joined {new Date(p.joinDate).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[11px] cursor-pointer select-none" onClick={() => handleSort("organizationName")}>
                        <span className="flex items-center">Organization <SortIcon column="organizationName" /></span>
                      </TableHead>
                      <TableHead className="text-[11px] cursor-pointer select-none" onClick={() => handleSort("organizationCategory")}>
                        <span className="flex items-center">Category <SortIcon column="organizationCategory" /></span>
                      </TableHead>
                      <TableHead className="text-[11px] cursor-pointer select-none" onClick={() => handleSort("plan")}>
                        <span className="flex items-center">Plan <SortIcon column="plan" /></span>
                      </TableHead>
                      <TableHead className="text-[11px] cursor-pointer select-none" onClick={() => handleSort("agentFirstName")}>
                        <span className="flex items-center">Contact <SortIcon column="agentFirstName" /></span>
                      </TableHead>
                      <TableHead className="text-[11px] cursor-pointer select-none" onClick={() => handleSort("organizationCity")}>
                        <span className="flex items-center">Location <SortIcon column="organizationCity" /></span>
                      </TableHead>
                      <TableHead className="text-[11px] text-center cursor-pointer select-none" onClick={() => handleSort("publishedEvents")}>
                        <span className="flex items-center justify-center">Published <SortIcon column="publishedEvents" /></span>
                      </TableHead>
                      <TableHead className="text-[11px] text-center cursor-pointer select-none" onClick={() => handleSort("pendingEvents")}>
                        <span className="flex items-center justify-center">Pending <SortIcon column="pendingEvents" /></span>
                      </TableHead>
                      <TableHead className="text-[11px] text-center cursor-pointer select-none" onClick={() => handleSort("totalProviders")}>
                        <span className="flex items-center justify-center">Providers <SortIcon column="totalProviders" /></span>
                      </TableHead>
                      <TableHead className="text-[11px] cursor-pointer select-none" onClick={() => handleSort("joinDate")}>
                        <span className="flex items-center">Joined <SortIcon column="joinDate" /></span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPartners.map((p) => (
                      <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPartner(p)}>
                        <TableCell className="py-2">
                          <div className="font-medium text-xs">{p.organizationName}</div>
                          <div className="text-[11px] text-muted-foreground">{p.organizationEmail}</div>
                        </TableCell>
                        <TableCell className="text-xs py-2">{p.organizationCategory}</TableCell>
                        <TableCell className="py-2">
                          <Badge className={`text-[10px] ${planColors[p.plan]}`}>{p.plan}</Badge>
                        </TableCell>
                        <TableCell className="text-xs py-2">{p.agentFirstName} {p.agentLastName}</TableCell>
                        <TableCell className="text-xs py-2">{p.organizationCity}, {p.organizationState}</TableCell>
                        <TableCell className="text-center font-medium text-xs py-2">{p.publishedEvents}</TableCell>
                        <TableCell className="text-center font-medium text-xs py-2">{p.pendingEvents}</TableCell>
                        <TableCell className="text-center font-medium text-xs py-2">{p.totalProviders}</TableCell>
                        <TableCell className="text-xs text-muted-foreground py-2">{new Date(p.joinDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedPartner && (
        <EventDetailDialog
          open={!!selectedPartner}
          onOpenChange={() => setSelectedPartner(null)}
          title={selectedPartner.organizationName}
          description={selectedPartner.organizationCategory}
          rows={getDetailRows(selectedPartner)}
        />
      )}
    </DashboardLayout>
  );
};

export default AdminPartnersListPage;
