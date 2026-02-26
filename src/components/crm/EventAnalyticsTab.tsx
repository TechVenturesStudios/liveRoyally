
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Users, DollarSign, TrendingUp, CalendarCheck, MapPin, Clock } from "lucide-react";

// Mock completed events data
const completedEvents = [
  {
    id: "e1",
    name: "Spring Wellness Fair",
    date: "2026-02-15",
    providerId: "p1",
    providerName: "Sunrise Health Clinic",
    location: "Downtown Community Center",
    membersAttended: 142,
    membersInvited: 200,
    revenue: 4250,
    targetRevenue: 5000,
    providerParticipated: true,
  },
  {
    id: "e2",
    name: "Nutrition Workshop Series",
    date: "2026-02-10",
    providerId: "p2",
    providerName: "Green Valley Nutrition",
    location: "Green Valley Office",
    membersAttended: 85,
    membersInvited: 100,
    revenue: 2100,
    targetRevenue: 2500,
    providerParticipated: true,
  },
  {
    id: "e3",
    name: "Fitness Bootcamp",
    date: "2026-02-01",
    providerId: "p1",
    providerName: "Sunrise Health Clinic",
    location: "City Park",
    membersAttended: 68,
    membersInvited: 120,
    revenue: 3400,
    targetRevenue: 3000,
    providerParticipated: true,
  },
  {
    id: "e4",
    name: "Mental Health Awareness Day",
    date: "2026-01-25",
    providerId: "p3",
    providerName: "Mindful Therapy Group",
    location: "Community Hall B",
    membersAttended: 95,
    membersInvited: 150,
    revenue: 1800,
    targetRevenue: 2000,
    providerParticipated: true,
  },
  {
    id: "e5",
    name: "Senior Yoga Program",
    date: "2026-01-18",
    providerId: "p2",
    providerName: "Green Valley Nutrition",
    location: "Riverside Studio",
    membersAttended: 40,
    membersInvited: 60,
    revenue: 1200,
    targetRevenue: 1500,
    providerParticipated: false,
  },
  {
    id: "e6",
    name: "Health Screening Expo",
    date: "2026-01-10",
    providerId: "p1",
    providerName: "Sunrise Health Clinic",
    location: "Convention Center",
    membersAttended: 210,
    membersInvited: 300,
    revenue: 6300,
    targetRevenue: 6000,
    providerParticipated: true,
  },
  {
    id: "e7",
    name: "Kids Wellness Day",
    date: "2026-01-05",
    providerId: "p4",
    providerName: "Family First Pediatrics",
    location: "Family First Office",
    membersAttended: 55,
    membersInvited: 80,
    revenue: 1650,
    targetRevenue: 2000,
    providerParticipated: true,
  },
  {
    id: "e8",
    name: "Holiday Stress Relief Workshop",
    date: "2025-12-20",
    providerId: "p3",
    providerName: "Mindful Therapy Group",
    location: "Downtown Wellness Loft",
    membersAttended: 72,
    membersInvited: 90,
    revenue: 2160,
    targetRevenue: 2000,
    providerParticipated: true,
  },
];

// Sort by most recent
export const sortedAnalyticsEvents = [...completedEvents].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);
const sortedEvents = sortedAnalyticsEvents;

const EventAnalyticsTab = () => {
  const [view, setView] = useState<"events" | "providers">("events");
  const [providerFilter, setProviderFilter] = useState<string>("all");

  // Compute summary stats
  const totalAttended = sortedEvents.reduce((s, e) => s + e.membersAttended, 0);
  const totalInvited = sortedEvents.reduce((s, e) => s + e.membersInvited, 0);
  const engagementPercent = totalInvited > 0 ? Math.round((totalAttended / totalInvited) * 100) : 0;

  const totalRevenue = sortedEvents.reduce((s, e) => s + e.revenue, 0);
  const totalTargetRevenue = sortedEvents.reduce((s, e) => s + e.targetRevenue, 0);
  const revenuePercent = totalTargetRevenue > 0 ? Math.round((totalRevenue / totalTargetRevenue) * 100) : 0;

  const participatingProviders = new Set(sortedEvents.filter(e => e.providerParticipated).map(e => e.providerId)).size;
  const totalProviders = new Set(sortedEvents.map(e => e.providerId)).size;
  const participationPercent = totalProviders > 0 ? Math.round((participatingProviders / totalProviders) * 100) : 0;

  // Group by provider
  const providerMap = new Map<string, { name: string; events: typeof sortedEvents }>();
  sortedEvents.forEach(e => {
    if (!providerMap.has(e.providerId)) {
      providerMap.set(e.providerId, { name: e.providerName, events: [] });
    }
    providerMap.get(e.providerId)!.events.push(e);
  });

  const uniqueProviders = Array.from(providerMap.entries()).map(([id, data]) => ({ id, name: data.name }));

  const filteredEvents = providerFilter === "all" ? sortedEvents : sortedEvents.filter(e => e.providerId === providerFilter);

  const EventCard = ({ event }: { event: typeof sortedEvents[0] }) => {
    const engRate = event.membersInvited > 0 ? Math.round((event.membersAttended / event.membersInvited) * 100) : 0;
    const revRate = event.targetRevenue > 0 ? Math.round((event.revenue / event.targetRevenue) * 100) : 0;
    return (
      <div className="border rounded-lg p-3 space-y-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 space-y-1.5">
            <h4 className="font-medium text-sm">{event.name}</h4>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              <span className="mx-1">·</span>
              <MapPin className="h-3 w-3" />
              {event.location}
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs pt-1">
              <div>
                <span className="text-muted-foreground block">Attendance</span>
                <span className="font-medium">{event.membersAttended} / {event.membersInvited}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Revenue</span>
                <span className="font-medium">${event.revenue.toLocaleString()} / ${event.targetRevenue.toLocaleString()}</span>
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
              {/* Engagement circle */}
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
              {/* Revenue circle */}
              <div className="flex items-center gap-1">
                <div className="relative h-8 w-8">
                  <svg viewBox="0 0 36 36" className="h-8 w-8 -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className={revRate >= 100 ? "text-green-500" : "text-amber-500"} strokeWidth="3" strokeDasharray={`${Math.min(revRate, 100) * 0.9425} 94.25`} strokeLinecap="round" />
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

  return (
    <div className="space-y-6">
      {/* View Toggle & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {view === "events" ? (
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="w-[200px] h-8 text-xs">
              <SelectValue placeholder="Filter by provider" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">All Providers</SelectItem>
              {uniqueProviders.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : <div />}
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

      {/* Events View */}
      {view === "events" && (
        <ScrollArea className="h-[500px]">
          <div className="space-y-3 pr-3">
            {filteredEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
            {filteredEvents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No completed events found.</p>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Providers View */}
      {view === "providers" && (
        <ScrollArea className="h-[500px]">
          <Accordion type="multiple" className="pr-3">
            {Array.from(providerMap.entries()).map(([providerId, data]) => {
              const provEvents = data.events;
              const provAttended = provEvents.reduce((s, e) => s + e.membersAttended, 0);
              const provInvited = provEvents.reduce((s, e) => s + e.membersInvited, 0);
              const provRevenue = provEvents.reduce((s, e) => s + e.revenue, 0);
              const provTarget = provEvents.reduce((s, e) => s + e.targetRevenue, 0);
              const provEngagement = provInvited > 0 ? Math.round((provAttended / provInvited) * 100) : 0;
              const provRevenueRate = provTarget > 0 ? Math.round((provRevenue / provTarget) * 100) : 0;
              const participated = provEvents.filter(e => e.providerParticipated).length;

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
                          <p className="text-xs text-muted-foreground">{provEvents.length} events · {participated}/{provEvents.length} participated</p>
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
                      {/* Provider summary */}
                      <div className="grid grid-cols-3 gap-3 text-xs border rounded-lg p-3 bg-muted/30 mb-3">
                        <div>
                          <span className="text-muted-foreground block">Total Attendance</span>
                          <span className="font-medium">{provAttended} / {provInvited}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Total Revenue</span>
                          <span className="font-medium">${provRevenue.toLocaleString()} / ${provTarget.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Revenue Hit Rate</span>
                          <span className="font-medium">{provRevenueRate}%</span>
                        </div>
                      </div>
                      {/* Event cards */}
                      {provEvents.map(event => (
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
    </div>
  );
};

export default EventAnalyticsTab;
