import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import EventDetailDialog from "@/components/ui/EventDetailDialog";
import ViewToggle from "@/components/ui/ViewToggle";
import { ArrowLeft, Building, Calendar, ChevronDown } from "lucide-react";
import { fetchAdminHistoricalEvents, AdminEventStatusGroup, AdminHistoricalEvent, AdminHistoricalPartner } from "@/api/adminHistoricalEvents";
import type { EventLifecycleStatus } from "@/utils/eventStatus";

type StatusFilter = "all" | AdminEventStatusGroup;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "historical", label: "Historical" },
];

const GROUP_ORDER: AdminEventStatusGroup[] = ["pending", "active", "historical"];
const GROUP_LABELS: Record<AdminEventStatusGroup, string> = { pending: "Pending", active: "Active", historical: "Historical" };

const STATUS_STYLES: Record<EventLifecycleStatus, string> = {
  pending: "bg-blue-50 text-blue-700 border-blue-200",
  active: "bg-green-50 text-green-700 border-green-200",
  completed: "bg-amber-50 text-amber-700 border-amber-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  expired: "bg-gray-100 text-gray-600 border-gray-200",
};

const StatusBadge = ({ status }: { status: EventLifecycleStatus }) => (
  <Badge variant="outline" className={`text-[10px] capitalize ${STATUS_STYLES[status]}`}>{status}</Badge>
);

const AdminHistoricalEventsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/dashboard/admin/profile";
  const [selectedEvent, setSelectedEvent] = useState<AdminHistoricalEvent | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [partners, setPartners] = useState<AdminHistoricalPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminHistoricalEvents()
      .then((data) => { if (!cancelled) setPartners(data.partners); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load events"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = { all: 0, pending: 0, active: 0, historical: 0 };
    for (const partner of partners) for (const event of partner.events) { result.all += 1; result[event.statusGroup] += 1; }
    return result;
  }, [partners]);

  const visiblePartners = useMemo(
    () => partners
      .map((partner) => ({ ...partner, events: statusFilter === "all" ? partner.events : partner.events.filter((event) => event.statusGroup === statusFilter) }))
      .filter((partner) => partner.events.length > 0),
    [partners, statusFilter],
  );

  const eventTable = (events: AdminHistoricalEvent[]) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[11px]">Event</TableHead>
            <TableHead className="text-[11px]">Status</TableHead>
            <TableHead className="text-[11px]">Date</TableHead>
            <TableHead className="text-[11px]">Location</TableHead>
            <TableHead className="text-[11px]">Attendance</TableHead>
            <TableHead className="text-[11px]">Accepted providers</TableHead>
            <TableHead className="text-[11px]">Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedEvent(event)}>
              <TableCell className="py-2"><div className="font-medium text-xs">{event.title}</div><div className="text-[11px] text-muted-foreground line-clamp-1">{event.description}</div></TableCell>
              <TableCell className="py-2"><StatusBadge status={event.status} /></TableCell>
              <TableCell className="text-xs py-2 whitespace-nowrap">{event.date}</TableCell>
              <TableCell className="text-xs py-2">{event.location}</TableCell>
              <TableCell className="text-xs py-2">{event.membersAttended}/{event.membersInvited}</TableCell>
              <TableCell className="text-xs py-2">{event.acceptedProviderCount}</TableCell>
              <TableCell className="text-xs py-2">${event.revenue.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  // When showing all statuses, split each partner's events into Pending / Active / Historical sections.
  const partnerEvents = (events: AdminHistoricalEvent[]) => {
    if (statusFilter !== "all") return eventTable(events);
    return (
      <div className="space-y-3">
        {GROUP_ORDER.map((group) => {
          const groupEvents = events.filter((event) => event.statusGroup === group);
          if (groupEvents.length === 0) return null;
          return (
            <div key={group}>
              <div className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{GROUP_LABELS[group]} ({groupEvents.length})</div>
              {eventTable(groupEvents)}
            </div>
          );
        })}
      </div>
    );
  };

  const statusSummary = (events: AdminHistoricalEvent[]) => GROUP_ORDER.map((group) => {
    const count = events.filter((event) => event.statusGroup === group).length;
    return count > 0 ? <Badge key={group} variant="secondary" className="text-[10px]">{count} {GROUP_LABELS[group].toLowerCase()}</Badge> : null;
  });

  const partnerBadges = (events: AdminHistoricalEvent[]) =>
    statusFilter === "all" ? statusSummary(events) : <Badge variant="secondary" className="text-[10px]">{events.length} events</Badge>;

  const emptyMessage = statusFilter === "all" ? "No events found." : `No ${GROUP_LABELS[statusFilter].toLowerCase()} events found.`;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground -ml-2 h-7 text-xs" onClick={() => navigate(from)}>
          <ArrowLeft className="h-3.5 w-3.5" />{from.includes("analytics") ? "Back to Analytics" : "Back to Home"}
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-barlow font-bold text-2xl sm:text-3xl mb-1">All Events</h1>
            <p className="text-sm text-muted-foreground">Pending, active, and historical events organized by partner</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
              <Calendar className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">{counts[statusFilter]} events</span>
            </div>
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <Button key={filter.value} size="sm" variant={statusFilter === filter.value ? "default" : "outline"} className="h-8 text-xs" onClick={() => setStatusFilter(filter.value)}>
              {filter.label} ({counts[filter.value]})
            </Button>
          ))}
        </div>
        {loading ? (
          <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">Loading events...</div>
        ) : error ? (
          <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-destructive">{error}</div>
        ) : visiblePartners.length === 0 ? (
          <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">{emptyMessage}</div>
        ) : viewMode === "list" ? (
          <div className="space-y-3">
            {visiblePartners.map((partner) => (
              <Collapsible key={partner.id}>
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 hover:bg-muted/50">
                      <div className="flex items-center gap-2 text-left">
                        <Building className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <h2 className="font-semibold text-sm">{partner.name}</h2>
                          <div className="text-[11px] text-muted-foreground">{partner.networkName}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {partnerBadges(partner.events)}
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t bg-muted/20 px-4 pb-3">{partnerEvents(partner.events)}</div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {visiblePartners.map((partner) => (
              <Card key={partner.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">{partner.name}</CardTitle>
                  <div className="text-xs text-muted-foreground">{partner.networkName}</div>
                  <div className="flex flex-wrap gap-2">{partnerBadges(partner.events)}</div>
                </CardHeader>
                <CardContent className="pt-0">{partnerEvents(partner.events)}</CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      {selectedEvent && (
        <EventDetailDialog
          open
          onOpenChange={() => setSelectedEvent(null)}
          title={selectedEvent.title}
          description={selectedEvent.description}
          rows={[
            { label: "Status", value: selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1) },
            { label: "Date", value: selectedEvent.date },
            { label: "Time", value: selectedEvent.time },
            { label: "Location", value: selectedEvent.location },
            { label: "Attendance", value: `${selectedEvent.membersAttended} / ${selectedEvent.membersInvited}` },
            { label: "Accepted providers", value: String(selectedEvent.acceptedProviderCount) },
            { label: "Revenue", value: `$${selectedEvent.revenue.toLocaleString()}` },
          ]}
        />
      )}
    </DashboardLayout>
  );
};

export default AdminHistoricalEventsPage;
