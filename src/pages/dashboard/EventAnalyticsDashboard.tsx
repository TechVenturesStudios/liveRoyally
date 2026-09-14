import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, CalendarCheck, TrendingUp, Users } from "lucide-react";
import EventAnalyticsTab from "@/components/crm/EventAnalyticsTab";
import {
  fetchPartnerDashboardEvents,
  fetchPartnerEventAnalytics,
  type PartnerDashboardEvent,
  type PartnerEventAnalytics,
} from "@/api/partnerEvents";
import { getUserFromStorage } from "@/utils/userStorage";

type PublishedEventRow = PartnerDashboardEvent & {
  providerNames: string[];
  participants: number;
  revenue: number;
  status: "active" | "future" | "past";
};

const statusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "future":
      return "bg-blue-100 text-blue-800";
    case "past":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const normalizePublishedStatus = (event: PartnerDashboardEvent): PublishedEventRow["status"] => {
  if (event.stage === "past") {
    return "past";
  }

  const status = String(event.status || "").toLowerCase();
  if (status === "published" || status === "active" || status === "completed") {
    return "active";
  }

  return "future";
};

const EventAnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState("analytics");
  const [partnerEvents, setPartnerEvents] = useState<PartnerDashboardEvent[]>([]);
  const [analyticsEvents, setAnalyticsEvents] = useState<PartnerEventAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<PublishedEventRow | null>(null);
  const [selectedPendingEvent, setSelectedPendingEvent] = useState<PartnerDashboardEvent | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cognitoId = getUserFromStorage()?.cognitoId;

    setIsLoading(true);

    Promise.all([
      fetchPartnerDashboardEvents(cognitoId),
      fetchPartnerEventAnalytics(cognitoId),
    ])
      .then(([dashboardEvents, analytics]) => {
        if (cancelled) {
          return;
        }

        setPartnerEvents(dashboardEvents);
        setAnalyticsEvents(analytics);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to load partner dashboard analytics:", error);
          setPartnerEvents([]);
          setAnalyticsEvents([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const analyticsByEventId = useMemo(
    () => new Map(analyticsEvents.map((event) => [event.id, event] as const)),
    [analyticsEvents]
  );

  const pendingEvents = useMemo(
    () => partnerEvents.filter((event) => event.stage === "needs_approval"),
    [partnerEvents]
  );

  const publishedEvents = useMemo(
    () =>
      partnerEvents
        .filter((event) => event.stage !== "needs_approval")
        .map<PublishedEventRow>((event) => {
          const analytics = analyticsByEventId.get(event.id);

          return {
            ...event,
            providerNames: event.providers.map((provider) => provider.providerName),
            participants: analytics?.membersAttended ?? 0,
            revenue: analytics?.revenue ?? 0,
            status: normalizePublishedStatus(event),
          };
        }),
    [analyticsByEventId, partnerEvents]
  );

  const pendingCount = pendingEvents.length;
  const publishedCount = publishedEvents.length;
  const activeCount = publishedEvents.filter((event) => event.status === "active").length;

  const totalAttended = analyticsEvents.reduce((sum, event) => sum + event.membersAttended, 0);
  const totalInvited = analyticsEvents.reduce((sum, event) => sum + event.membersInvited, 0);
  const engagementPercent = totalInvited > 0 ? Math.round((totalAttended / totalInvited) * 100) : 0;

  const participatingProviders = new Set(analyticsEvents.filter((event) => event.providerParticipated).map((event) => event.providerId)).size;
  const totalProviders = new Set(analyticsEvents.map((event) => event.providerId)).size;
  const participationPercent = totalProviders > 0 ? Math.round((participatingProviders / totalProviders) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold royal-header">Event Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Track events and analyze performance metrics
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card
          className="bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => setActiveTab("analytics")}
        >
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-800">Member Engagement</p>
                <p className="text-xl font-bold text-blue-900">{engagementPercent}%</p>
                <p className="text-[11px] text-blue-600">{totalAttended.toLocaleString()} / {totalInvited.toLocaleString()}</p>
              </div>
              <div className="rounded-full p-2 bg-blue-100">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-purple-50 border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors"
          onClick={() => setActiveTab("analytics")}
        >
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-800">Provider Participation</p>
                <p className="text-xl font-bold text-purple-900">{participationPercent}%</p>
                <p className="text-[11px] text-purple-600">{participatingProviders} / {totalProviders} active</p>
              </div>
              <div className="rounded-full p-2 bg-purple-100">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Pending Events</span>
          </TabsTrigger>
          <TabsTrigger value="published" className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            <span>Published Events</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Event Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="space-y-4">
            <h2 className="text-xl font-barlow font-bold">Pending Events</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Event</TableHead>
                  <TableHead className="text-xs">Location</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Providers</TableHead>
                  <TableHead className="text-xs">Network Points</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingEvents.map((event) => {
                  const acceptedCount = event.acceptedProviderCount;
                  const totalCount = event.providers.length;

                  return (
                    <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPendingEvent(event)}>
                      <TableCell className="font-medium text-xs py-2">{event.title}</TableCell>
                      <TableCell className="text-xs py-2">{event.location}</TableCell>
                      <TableCell className="text-xs py-2">
                        {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </TableCell>
                      <TableCell className="text-xs py-2">{acceptedCount}/{totalCount} accepted</TableCell>
                      <TableCell className="text-xs py-2">{event.networkPoints} pts</TableCell>
                      <TableCell className="py-2">
                        <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-800">Pending</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <Dialog open={!!selectedPendingEvent} onOpenChange={(open) => { if (!open) setSelectedPendingEvent(null); }}>
            <DialogContent className="sm:max-w-[450px]">
              {selectedPendingEvent && (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-base">{selectedPendingEvent.title}</DialogTitle>
                    <DialogDescription className="text-xs">{selectedPendingEvent.description}</DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-[350px]">
                    <div className="space-y-4 pr-3">
                      <div className="flex items-center gap-2">
                        <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-800">Pending</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(selectedPendingEvent.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground block">Time</span>
                          <span className="font-medium">{selectedPendingEvent.time}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Location</span>
                          <span className="font-medium">{selectedPendingEvent.location}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Network Points</span>
                          <span className="font-medium">{selectedPendingEvent.networkPoints} pts</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Event ID</span>
                          <span className="font-medium">{selectedPendingEvent.id}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Invited Providers</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedPendingEvent.providers.map((provider, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className={`text-[10px] ${provider.status === "accepted" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                            >
                              {provider.providerName} · {provider.status}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="published">
          <div className="space-y-4">
            <h2 className="text-xl font-barlow font-bold">Published Events</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Event</TableHead>
                  <TableHead className="text-xs">Location</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Providers</TableHead>
                  <TableHead className="text-xs">Members Participating</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {publishedEvents.map((event) => (
                  <TableRow
                    key={event.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <TableCell className="font-medium text-xs py-2">{event.title}</TableCell>
                    <TableCell className="text-xs py-2">{event.location}</TableCell>
                    <TableCell className="text-xs py-2">
                      {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-xs py-2">{event.providerNames.length}</TableCell>
                    <TableCell className="text-xs py-2">{event.participants}</TableCell>
                    <TableCell className="py-2">
                      <Badge className={`text-[10px] px-1.5 py-0 ${statusColor(event.status)}`}>
                        {event.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Dialog open={!!selectedEvent} onOpenChange={(open) => { if (!open) setSelectedEvent(null); }}>
            <DialogContent className="sm:max-w-[450px]">
              {selectedEvent && (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-base">{selectedEvent.title}</DialogTitle>
                    <DialogDescription className="text-xs">{selectedEvent.description}</DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-[350px]">
                    <div className="space-y-4 pr-3">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] px-1.5 py-0 ${statusColor(selectedEvent.status)}`}>
                          {selectedEvent.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(selectedEvent.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground block">Time</span>
                          <span className="font-medium">{selectedEvent.time}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Location</span>
                          <span className="font-medium">{selectedEvent.location}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Participants</span>
                          <span className="font-medium">{selectedEvent.participants}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Network Points</span>
                          <span className="font-medium">{selectedEvent.networkPoints} pts</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Revenue</span>
                          <span className="font-medium">${selectedEvent.revenue.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Event ID</span>
                          <span className="font-medium">{selectedEvent.id}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Assigned Providers</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedEvent.providerNames.map((name, index) => (
                            <Badge key={index} variant="outline" className="text-[10px]">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="analytics">
          <EventAnalyticsTab events={analyticsEvents} loading={isLoading} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default EventAnalyticsDashboard;
