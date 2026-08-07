import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Users, CalendarCheck, MapPin, Clock } from "lucide-react";
import type { PartnerDashboardEvent } from "@/api/partnerEvents";

type AnalyticsEvent = PartnerDashboardEvent & {
  providerId: string;
  providerName: string;
  membersAttended: number;
  membersInvited: number;
  revenue: number;
  targetRevenue: number;
  providerParticipated: boolean;
};

type EventAnalyticsTabProps = {
  events?: PartnerDashboardEvent[];
  loading?: boolean;
};

// Mock completed events data kept for the standalone Event Analytics page.
const completedEvents: AnalyticsEvent[] = [
  {
    id: "e1",
    title: "Spring Wellness Fair",
    description: "",
    date: "2026-02-15",
    time: "",
    location: "Downtown Community Center",
    networkPoints: 0,
    createdDate: "2026-02-01",
    responseDeadline: "",
    status: "past",
    stage: "past",
    providerCount: 1,
    pendingProviderCount: 0,
    acceptedProviderCount: 1,
    declinedProviderCount: 0,
    providers: [],
    providerId: "p1",
    providerName: "Sunrise Health Clinic",
    membersAttended: 142,
    membersInvited: 200,
    revenue: 4250,
    targetRevenue: 5000,
    providerParticipated: true,
  },
  {
    id: "e2",
    title: "Nutrition Workshop Series",
    description: "",
    date: "2026-02-10",
    time: "",
    location: "Green Valley Office",
    networkPoints: 0,
    createdDate: "2026-01-20",
    responseDeadline: "",
    status: "past",
    stage: "past",
    providerCount: 1,
    pendingProviderCount: 0,
    acceptedProviderCount: 1,
    declinedProviderCount: 0,
    providers: [],
    providerId: "p2",
    providerName: "Green Valley Nutrition",
    membersAttended: 85,
    membersInvited: 100,
    revenue: 2100,
    targetRevenue: 2500,
    providerParticipated: true,
  },
  {
    id: "e3",
    title: "Fitness Bootcamp",
    description: "",
    date: "2026-02-01",
    time: "",
    location: "City Park",
    networkPoints: 0,
    createdDate: "2026-01-12",
    responseDeadline: "",
    status: "past",
    stage: "past",
    providerCount: 1,
    pendingProviderCount: 0,
    acceptedProviderCount: 1,
    declinedProviderCount: 0,
    providers: [],
    providerId: "p1",
    providerName: "Sunrise Health Clinic",
    membersAttended: 68,
    membersInvited: 120,
    revenue: 3400,
    targetRevenue: 3000,
    providerParticipated: true,
  },
  {
    id: "e4",
    title: "Mental Health Awareness Day",
    description: "",
    date: "2026-01-25",
    time: "",
    location: "Community Hall B",
    networkPoints: 0,
    createdDate: "2026-01-05",
    responseDeadline: "",
    status: "past",
    stage: "past",
    providerCount: 1,
    pendingProviderCount: 0,
    acceptedProviderCount: 1,
    declinedProviderCount: 0,
    providers: [],
    providerId: "p3",
    providerName: "Mindful Therapy Group",
    membersAttended: 95,
    membersInvited: 150,
    revenue: 1800,
    targetRevenue: 2000,
    providerParticipated: true,
  },
  {
    id: "e5",
    title: "Senior Yoga Program",
    description: "",
    date: "2026-01-18",
    time: "",
    location: "Riverside Studio",
    networkPoints: 0,
    createdDate: "2025-12-28",
    responseDeadline: "",
    status: "past",
    stage: "past",
    providerCount: 1,
    pendingProviderCount: 0,
    acceptedProviderCount: 0,
    declinedProviderCount: 1,
    providers: [],
    providerId: "p2",
    providerName: "Green Valley Nutrition",
    membersAttended: 40,
    membersInvited: 60,
    revenue: 1200,
    targetRevenue: 1500,
    providerParticipated: false,
  },
  {
    id: "e6",
    title: "Health Screening Expo",
    description: "",
    date: "2026-01-10",
    time: "",
    location: "Convention Center",
    networkPoints: 0,
    createdDate: "2025-12-20",
    responseDeadline: "",
    status: "past",
    stage: "past",
    providerCount: 1,
    pendingProviderCount: 0,
    acceptedProviderCount: 1,
    declinedProviderCount: 0,
    providers: [],
    providerId: "p1",
    providerName: "Sunrise Health Clinic",
    membersAttended: 210,
    membersInvited: 300,
    revenue: 6300,
    targetRevenue: 6000,
    providerParticipated: true,
  },
  {
    id: "e7",
    title: "Kids Wellness Day",
    description: "",
    date: "2026-01-05",
    time: "",
    location: "Family First Office",
    networkPoints: 0,
    createdDate: "2025-12-18",
    responseDeadline: "",
    status: "past",
    stage: "past",
    providerCount: 1,
    pendingProviderCount: 0,
    acceptedProviderCount: 1,
    declinedProviderCount: 0,
    providers: [],
    providerId: "p4",
    providerName: "Family First Pediatrics",
    membersAttended: 55,
    membersInvited: 80,
    revenue: 1650,
    targetRevenue: 2000,
    providerParticipated: true,
  },
  {
    id: "e8",
    title: "Holiday Stress Relief Workshop",
    description: "",
    date: "2025-12-20",
    time: "",
    location: "Downtown Wellness Loft",
    networkPoints: 0,
    createdDate: "2025-12-01",
    responseDeadline: "",
    status: "past",
    stage: "past",
    providerCount: 1,
    pendingProviderCount: 0,
    acceptedProviderCount: 1,
    declinedProviderCount: 0,
    providers: [],
    providerId: "p3",
    providerName: "Mindful Therapy Group",
    membersAttended: 72,
    membersInvited: 90,
    revenue: 2160,
    targetRevenue: 2000,
    providerParticipated: true,
  },
];

const sortByMostRecent = (items: AnalyticsEvent[]) =>
  [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const sortedAnalyticsEvents = sortByMostRecent(completedEvents);

const getPrimaryProvider = (event: PartnerDashboardEvent) => {
  const primaryInvite = event.providers.find((provider) => provider.status === "accepted") ?? event.providers[0];
  return {
    id: primaryInvite?.providerId ?? event.id,
    name: primaryInvite?.providerName ?? "Unnamed Provider",
  };
};

const buildPlaceholderAnalytics = (event: PartnerDashboardEvent, index: number): AnalyticsEvent => {
  const primaryProvider = getPrimaryProvider(event);
  const providerCount = Math.max(event.providerCount || 0, event.providers.length || 0, 1);
  const acceptedCount = event.acceptedProviderCount || 0;
  const membersInvited = Math.max(providerCount * 25, 50 + index * 5);
  const membersAttended = Math.max(0, Math.min(membersInvited, Math.round(membersInvited * (event.stage === "past" ? 0.68 : 0.45))));
  const targetRevenue = Math.max(event.networkPoints * 20, providerCount * 500, 1000);
  const revenue = Math.round(targetRevenue * (event.stage === "past" ? 0.84 : 0.5));

  return {
    ...event,
    providerId: primaryProvider.id,
    providerName: primaryProvider.name,
    membersAttended,
    membersInvited,
    revenue,
    targetRevenue,
    providerParticipated: acceptedCount > 0,
  };
};

const EventAnalyticsTab = ({ events, loading = false }: EventAnalyticsTabProps) => {
  const [view, setView] = useState<"events" | "providers">("events");
  const [providerFilter, setProviderFilter] = useState<string>("all");

  const analyticsEvents = useMemo(() => {
    if (events !== undefined) {
      return sortByMostRecent(
        events
          .filter((event) => event.stage === "past")
          .map((event, index) => buildPlaceholderAnalytics(event, index))
      );
    }

    return sortedAnalyticsEvents;
  }, [events]);

  const providerMap = useMemo(() => {
    const map = new Map<string, { name: string; events: AnalyticsEvent[] }>();

    analyticsEvents.forEach((event) => {
      if (!map.has(event.providerId)) {
        map.set(event.providerId, { name: event.providerName, events: [] });
      }

      map.get(event.providerId)!.events.push(event);
    });

    return map;
  }, [analyticsEvents]);

  const uniqueProviders = useMemo(
    () => Array.from(providerMap.entries()).map(([id, data]) => ({ id, name: data.name })),
    [providerMap]
  );

  const filteredEvents = useMemo(
    () => (providerFilter === "all" ? analyticsEvents : analyticsEvents.filter((event) => event.providerId === providerFilter)),
    [analyticsEvents, providerFilter]
  );

  const totalAttended = analyticsEvents.reduce((sum, event) => sum + event.membersAttended, 0);
  const totalInvited = analyticsEvents.reduce((sum, event) => sum + event.membersInvited, 0);
  const engagementPercent = totalInvited > 0 ? Math.round((totalAttended / totalInvited) * 100) : 0;

  const totalRevenue = analyticsEvents.reduce((sum, event) => sum + event.revenue, 0);
  const totalTargetRevenue = analyticsEvents.reduce((sum, event) => sum + event.targetRevenue, 0);
  const revenuePercent = totalTargetRevenue > 0 ? Math.round((totalRevenue / totalTargetRevenue) * 100) : 0;

  const participatingProviders = new Set(analyticsEvents.filter((event) => event.providerParticipated).map((event) => event.providerId)).size;
  const totalProviders = new Set(analyticsEvents.map((event) => event.providerId)).size;
  const participationPercent = totalProviders > 0 ? Math.round((participatingProviders / totalProviders) * 100) : 0;

  const EventCard = ({ event }: { event: AnalyticsEvent }) => {
    const engRate = event.membersInvited > 0 ? Math.round((event.membersAttended / event.membersInvited) * 100) : 0;
    const revRate = event.targetRevenue > 0 ? Math.round((event.revenue / event.targetRevenue) * 100) : 0;

    return (
      <div className="border rounded-lg p-3 space-y-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 space-y-1.5">
            <h4 className="font-medium text-sm">{event.title}</h4>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              <span className="mx-1">-</span>
              <MapPin className="h-3 w-3" />
              {event.location}
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs pt-1">
              <div>
                <span className="text-muted-foreground block">Attendance</span>
                <span className="font-medium">
                  {event.membersAttended} / {event.membersInvited}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Revenue</span>
                <span className="font-medium">
                  ${event.revenue.toLocaleString()} / ${event.targetRevenue.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Provider</span>
                <span className="font-medium truncate block">{event.providerName}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge className={event.providerParticipated ? "bg-green-100 text-green-800 text-xs" : "bg-red-100 text-red-800 text-xs"}>
              {event.providerParticipated ? "Participated" : "No-show"}
            </Badge>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="relative h-8 w-8">
                  <svg viewBox="0 0 36 36" className="h-8 w-8 -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-blue-500" strokeWidth="3" strokeDasharray={`${engRate * 0.9425} 94.25`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold">{engRate}%</span>
                </div>
                <span className="text-[8px] text-muted-foreground">Eng.</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="relative h-8 w-8">
                  <svg viewBox="0 0 36 36" className="h-8 w-8 -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke="currentColor"
                      className={revRate >= 100 ? "text-green-500" : "text-amber-500"}
                      strokeWidth="3"
                      strokeDasharray={`${Math.min(revRate, 100) * 0.9425} 94.25`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold">{revRate}%</span>
                </div>
                <span className="text-[8px] text-muted-foreground">Rev.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const showLiveDataNote = events !== undefined;

  return (
    <div className="space-y-6">
      {showLiveDataNote && (
        <div className="rounded-lg border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Event and provider records now come from the database. Attendance and revenue metrics are still mocked because those historical outcome fields are not stored yet.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {view === "events" ? (
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="w-[200px] h-8 text-xs">
              <SelectValue placeholder="Filter by provider" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">All Providers</SelectItem>
              {uniqueProviders.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div />
        )}
        <div className="flex rounded-lg border overflow-hidden">
          <Button
            variant={view === "events" ? "default" : "ghost"}
            size="sm"
            className="rounded-none text-xs"
            onClick={() => setView("events")}
          >
            <CalendarCheck className="h-3.5 w-3.5 mr-1.5" />
            Events View
          </Button>
          <Button
            variant={view === "providers" ? "default" : "ghost"}
            size="sm"
            className="rounded-none text-xs"
            onClick={() => setView("providers")}
          >
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Providers View
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          Loading event analytics...
        </div>
      ) : (
        <>
          {view === "events" && (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3 pr-3">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
                {filteredEvents.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No completed events found.</p>
                )}
              </div>
            </ScrollArea>
          )}

          {view === "providers" && (
            <ScrollArea className="h-[500px]">
              <Accordion type="multiple" className="pr-3">
                {Array.from(providerMap.entries()).map(([providerId, data]) => {
                  const provEvents = data.events;
                  const provAttended = provEvents.reduce((sum, event) => sum + event.membersAttended, 0);
                  const provInvited = provEvents.reduce((sum, event) => sum + event.membersInvited, 0);
                  const provRevenue = provEvents.reduce((sum, event) => sum + event.revenue, 0);
                  const provTarget = provEvents.reduce((sum, event) => sum + event.targetRevenue, 0);
                  const provEngagement = provInvited > 0 ? Math.round((provAttended / provInvited) * 100) : 0;
                  const provRevenueRate = provTarget > 0 ? Math.round((provRevenue / provTarget) * 100) : 0;
                  const participated = provEvents.filter((event) => event.providerParticipated).length;

                  return (
                    <AccordionItem key={providerId} value={providerId}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-full p-2 bg-muted">
                              <Users className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-sm">{data.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {provEvents.length} events - {participated}/{provEvents.length} participated
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-4 text-xs text-right">
                            <div>
                              <span className="text-muted-foreground block">Engagement</span>
                              <span className="font-medium">{provEngagement}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block">Revenue</span>
                              <span className="font-medium">${provRevenue.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pl-11">
                          <div className="grid grid-cols-3 gap-3 text-xs border rounded-lg p-3 bg-muted/30 mb-3">
                            <div>
                              <span className="text-muted-foreground block">Total Attendance</span>
                              <span className="font-medium">
                                {provAttended} / {provInvited}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block">Total Revenue</span>
                              <span className="font-medium">
                                ${provRevenue.toLocaleString()} / ${provTarget.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block">Revenue Hit Rate</span>
                              <span className="font-medium">{provRevenueRate}%</span>
                            </div>
                          </div>
                          {provEvents.map((event) => (
                            <EventCard key={event.id} event={event} />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </ScrollArea>
          )}
        </>
      )}
    </div>
  );
};

export default EventAnalyticsTab;
