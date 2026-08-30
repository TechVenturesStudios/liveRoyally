import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Users, CalendarCheck, MapPin, Clock } from "lucide-react";
import {
  fetchPartnerEventAnalytics,
  type PartnerDashboardEvent,
  type PartnerEventAnalytics,
} from "@/api/partnerEvents";
import { getUserFromStorage } from "@/utils/userStorage";

type EventAnalyticsTabProps = {
  events?: Array<PartnerDashboardEvent | PartnerEventAnalytics>;
  loading?: boolean;
};

const sortByMostRecent = (items: PartnerEventAnalytics[]) =>
  [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const isAnalyticsEvent = (event: PartnerDashboardEvent | PartnerEventAnalytics): event is PartnerEventAnalytics =>
  "providerId" in event &&
  "providerName" in event &&
  "membersAttended" in event &&
  "membersInvited" in event &&
  "revenue" in event &&
  "targetRevenue" in event &&
  "providerParticipated" in event;

const EventAnalyticsTab = ({ events, loading = false }: EventAnalyticsTabProps) => {
  const [view, setView] = useState<"events" | "providers">("events");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [fetchedEvents, setFetchedEvents] = useState<PartnerEventAnalytics[]>([]);
  const [isFetching, setIsFetching] = useState(events === undefined);

  useEffect(() => {
    if (events === undefined) {
      let cancelled = false;
      setIsFetching(true);

      const cognitoId = getUserFromStorage()?.cognitoId;

      fetchPartnerEventAnalytics(cognitoId)
        .then((result) => {
          if (!cancelled) {
            setFetchedEvents(result);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            console.error("Failed to load partner event analytics:", error);
            setFetchedEvents([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsFetching(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }

    if (events.length === 0) {
      setFetchedEvents([]);
      setIsFetching(false);
      return;
    }

    if (events.every(isAnalyticsEvent)) {
      setFetchedEvents(events);
      setIsFetching(false);
      return;
    }

    let cancelled = false;
    setIsFetching(true);

    const cognitoId = getUserFromStorage()?.cognitoId;

    fetchPartnerEventAnalytics(cognitoId)
      .then((result) => {
        if (!cancelled) {
          setFetchedEvents(result);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to load partner event analytics:", error);
          setFetchedEvents([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsFetching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [events]);

  const analyticsEvents = useMemo<PartnerEventAnalytics[]>(() => {
    if (events === undefined) {
      return sortByMostRecent(fetchedEvents);
    }

    if (events.length === 0) {
      return [];
    }

    if (events.every(isAnalyticsEvent)) {
      return sortByMostRecent(events);
    }

    return sortByMostRecent(fetchedEvents);
  }, [events, fetchedEvents]);

  const providerMap = useMemo(() => {
    const map = new Map<string, { name: string; events: PartnerEventAnalytics[] }>();

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

  const EventCard = ({ event }: { event: PartnerEventAnalytics }) => {
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

  const showLiveDataNote = !isFetching && !loading;
  const isLoading = loading || isFetching;

  return (
    <div className="space-y-6">
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

      {isLoading ? (
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
