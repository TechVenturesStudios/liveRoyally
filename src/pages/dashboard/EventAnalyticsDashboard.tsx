
import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, CalendarCheck, TrendingUp, Users, ArrowUp, ArrowDown, Send, CheckCircle, History, CalendarDays, DollarSign } from "lucide-react";
import EventAnalyticsTab, { sortedAnalyticsEvents } from "@/components/crm/EventAnalyticsTab";

// Mock pending events
const mockPendingEvents = [
  {
    id: "BPE001",
    title: "Community Spring Festival",
    description: "A fun community gathering to welcome the spring season",
    date: "2025-06-15",
    time: "10:00 AM - 4:00 PM",
    location: "City Park",
    networkPoints: 150,
    providers: [
      { name: "Smith's Merchandise", status: "pending" },
      { name: "Johnson Cafe", status: "pending" },
    ],
  },
  {
    id: "BPE002",
    title: "Tech Innovation Showcase",
    description: "Highlighting cutting-edge tech from local innovators",
    date: "2025-08-10",
    time: "10:00 AM - 3:00 PM",
    location: "Tech Hub",
    networkPoints: 200,
    providers: [
      { name: "Williams Fitness", status: "pending" },
      { name: "Smith's Merchandise", status: "approved" },
    ],
  },
  {
    id: "BPE003",
    title: "Holiday Market 2025",
    description: "Seasonal market with local vendors and festive activities",
    date: "2025-12-10",
    time: "12:00 PM - 8:00 PM",
    location: "Shopping District",
    networkPoints: 225,
    providers: [
      { name: "Johnson Cafe", status: "pending" },
      { name: "Williams Fitness", status: "pending" },
      { name: "Smith's Merchandise", status: "pending" },
    ],
  },
];

// Mock published events
const mockPublishedEvents = [
  { id: "PUB001", title: "Summer Market Festival", date: "2025-07-15", time: "10:00 AM - 4:00 PM", location: "Downtown Plaza", description: "A vibrant market showcasing local businesses and artisans", status: "active", providerNames: ["Smith's Merchandise", "Johnson Cafe"], participants: 45, networkPoints: 200, revenue: 3200 },
  { id: "PUB002", title: "Health & Wellness Expo", date: "2025-09-05", time: "9:00 AM - 2:00 PM", location: "Community Center", description: "Promote health services to the community", status: "future", providerNames: ["Williams Fitness"], participants: 0, networkPoints: 175, revenue: 0 },
  { id: "PUB003", title: "Back to School Drive", date: "2025-10-20", time: "11:00 AM - 5:00 PM", location: "Central Park", description: "Support local families with school supplies", status: "future", providerNames: ["Smith's Merchandise", "Williams Fitness"], participants: 0, networkPoints: 250, revenue: 0 },
  { id: "PUB004", title: "Spring Community Fair", date: "2025-03-28", time: "11:00 AM - 5:00 PM", location: "Central Park", description: "Annual community gathering with local vendors and entertainment", status: "past", providerNames: ["Smith's Merchandise", "Johnson Cafe", "Williams Fitness"], participants: 120, networkPoints: 300, revenue: 5400 },
  { id: "PUB005", title: "Holiday Shopping Event", date: "2024-12-15", time: "12:00 PM - 8:00 PM", location: "Shopping District", description: "Special holiday promotion event for local shops", status: "past", providerNames: ["Smith's Merchandise", "Johnson Cafe"], participants: 85, networkPoints: 225, revenue: 4100 },
];

const EventAnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState("analytics");
  const [selectedEvent, setSelectedEvent] = useState<typeof mockPublishedEvents[0] | null>(null);
  const [selectedPendingEvent, setSelectedPendingEvent] = useState<typeof mockPendingEvents[0] | null>(null);

  const pendingCount = mockPendingEvents.length;
  const publishedCount = mockPublishedEvents.length;
  const activeCount = mockPublishedEvents.filter(e => e.status === "active").length;

  // Compute summary stats from analytics events
  const totalAttended = sortedAnalyticsEvents.reduce((s, e) => s + e.membersAttended, 0);
  const totalInvited = sortedAnalyticsEvents.reduce((s, e) => s + e.membersInvited, 0);
  const engagementPercent = totalInvited > 0 ? Math.round((totalAttended / totalInvited) * 100) : 0;

  const totalRevenue = sortedAnalyticsEvents.reduce((s, e) => s + e.revenue, 0);
  const totalTargetRevenue = sortedAnalyticsEvents.reduce((s, e) => s + e.targetRevenue, 0);
  const revenuePercent = totalTargetRevenue > 0 ? Math.round((totalRevenue / totalTargetRevenue) * 100) : 0;

  const participatingProviders = new Set(sortedAnalyticsEvents.filter(e => e.providerParticipated).map(e => e.providerId)).size;
  const totalProviders = new Set(sortedAnalyticsEvents.map(e => e.providerId)).size;
  const participationPercent = totalProviders > 0 ? Math.round((participatingProviders / totalProviders) * 100) : 0;

  const statusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "future": return "bg-blue-100 text-blue-800";
      case "past": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold royal-header">Event Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Track events and analyze performance metrics
        </p>
      </div>

      {/* KPI Cards - Member Engagement, Revenue, Provider Participation */}
      <div className="grid grid-cols-3 gap-3 mb-6">
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
          className="bg-green-50 border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
          onClick={() => setActiveTab("analytics")}
        >
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-800">Total % of Money Made</p>
                <p className="text-xl font-bold text-green-900">{revenuePercent}%</p>
                <p className="text-[11px] text-green-600">${totalRevenue.toLocaleString()} / ${totalTargetRevenue.toLocaleString()}</p>
              </div>
              <div className="rounded-full p-2 bg-green-100">
                <DollarSign className="h-4 w-4 text-green-600" />
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

      {/* Tabs */}
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

        {/* Pending Events Tab */}
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
                {mockPendingEvents.map(event => {
                  const approvedCount = event.providers.filter(p => p.status === "approved").length;
                  const totalCount = event.providers.length;
                  return (
                    <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPendingEvent(event)}>
                      <TableCell className="font-medium text-xs py-2">{event.title}</TableCell>
                      <TableCell className="text-xs py-2">{event.location}</TableCell>
                      <TableCell className="text-xs py-2">
                        {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </TableCell>
                      <TableCell className="text-xs py-2">{approvedCount}/{totalCount} approved</TableCell>
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

          {/* Pending Event Details Dialog */}
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
                          {selectedPendingEvent.providers.map((p, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className={`text-[10px] ${p.status === "approved" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                            >
                              {p.name} · {p.status}
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

        {/* Published Events Tab */}
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
                {mockPublishedEvents.map(event => (
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

          {/* Event Details Dialog */}
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
                      {/* Status & Date */}
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] px-1.5 py-0 ${statusColor(selectedEvent.status)}`}>
                          {selectedEvent.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(selectedEvent.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>

                      {/* Details grid */}
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

                      {/* Providers */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Assigned Providers</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedEvent.providerNames.map((name, i) => (
                            <Badge key={i} variant="outline" className="text-[10px]">
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

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <EventAnalyticsTab />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default EventAnalyticsDashboard;
