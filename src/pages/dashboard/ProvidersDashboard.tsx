
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, User, MessageSquare, Users, Ticket, Tag, Medal, CalendarCheck, ClipboardCheck } from "lucide-react";
import { ProviderUser } from "@/types/user";
import { mockProviders, mockEvents, mockAuthorizedReps, mockNetworkMembers } from "@/data/providerMockData";
import MobileFolderTabs from "@/components/ui/MobileFolderTabs";

import PendingEventsTab from "@/components/providers/PendingEventsTab";
import RepresentativesTab from "@/components/providers/RepresentativesTab";
import HistoricalEventsTab from "@/components/providers/HistoricalEventsTab";
import UpcomingEventsTab from "@/components/providers/UpcomingEventsTab";
import ProviderEventInfo from "@/components/providers/ProviderEventInfo";
import MessagingTab from "@/components/crm/MessagingTab";
import EventApprovalTab from "@/components/providers/EventApprovalTab";

// Mock network/voucher data for KPI cards
const networkStats = {
  totalMembers: 342,
  totalVouchersUsed: 1_287,
  dealBreakdown: [
    { type: "% Off", count: 514 },
    { type: "$ Off", count: 389 },
    { type: "Free Item", count: 248 },
    { type: "BOGO", count: 136 },
  ],
};

const ProvidersDashboard = () => {
  const [provider, setProvider] = useState<ProviderUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState(mockEvents);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [authorizedReps, setAuthorizedReps] = useState(mockAuthorizedReps);
  const [networkMembers, setNetworkMembers] = useState(mockNetworkMembers);
  const [activeTab, setActiveTab] = useState("events");

  // KPI popups
  const [showMembers, setShowMembers] = useState(false);
  const [showVouchers, setShowVouchers] = useState(false);
  const [showScore, setShowScore] = useState(false);

  useEffect(() => {
    setProvider(mockProviders[0]);
    setIsLoading(false);
  }, []);

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    const sortedEvents = [...events].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return newOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
    setEvents(sortedEvents);
  };

  const handleAddRepresentative = (selectedMemberId: string) => {
    const selectedMember = networkMembers.find(member => member.id === selectedMemberId);
    if (selectedMember) {
      setAuthorizedReps([...authorizedReps, {
        id: selectedMember.id,
        name: selectedMember.name,
        email: selectedMember.email,
        phone: "Not provided",
        role: "Assistant Representative",
        status: "active"
      }]);
    }
  };

  const handleRemoveRepresentative = (repId: string) => {
    setAuthorizedReps(authorizedReps.filter(rep => rep.id !== repId));
  };

  const pendingCount = events.filter(e => e.status === "pending").length;
  const upcomingCount = events.filter(e => e.status === "active").length;
  const historicalCount = events.filter(e => e.status === "completed" && e.participated).length;
  const networkScore = events
    .filter(e => e.status === "completed" && e.participated)
    .reduce((t, e) => t + e.networkScore, 0);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-bold royal-header">Provider CRM Dashboard</h1>
        <p className="text-muted-foreground text-xs sm:text-base mt-1 sm:mt-2">
          Manage your events, representatives, and network engagement
        </p>
      </div>

      {/* Mobile: compact horizontal KPI buttons */}
      <div className="flex sm:hidden gap-1.5 mb-4">
        <button
          className="flex-1 flex items-center gap-1 px-2 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors text-left"
          onClick={() => setShowMembers(true)}
        >
          <Users className="h-3 w-3 text-blue-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] font-medium text-blue-800 truncate">Members</p>
            <p className="text-xs font-bold text-blue-900">{networkStats.totalMembers}</p>
          </div>
        </button>
        <button
          className="flex-1 flex items-center gap-1 px-2 py-1.5 rounded-md bg-green-50 hover:bg-green-100 transition-colors text-left"
          onClick={() => setShowVouchers(true)}
        >
          <Ticket className="h-3 w-3 text-green-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] font-medium text-green-800 truncate">Vouchers</p>
            <p className="text-xs font-bold text-green-900">{networkStats.totalVouchersUsed.toLocaleString()}</p>
          </div>
        </button>
        <button
          className="flex-1 flex items-center gap-1 px-2 py-1.5 rounded-md bg-amber-50 hover:bg-amber-100 transition-colors text-left"
          onClick={() => setShowScore(true)}
        >
          <Medal className="h-3 w-3 text-amber-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] font-medium text-amber-800 truncate">Score</p>
            <p className="text-xs font-bold text-amber-900">{networkScore}</p>
          </div>
        </button>
      </div>

      {/* Desktop: full KPI cards */}
      <div className="hidden sm:grid grid-cols-3 gap-3 mb-6">
        <Card
          className="bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => setShowMembers(true)}
        >
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-800">Network Members</p>
                <p className="text-xl font-bold text-blue-900">{networkStats.totalMembers}</p>
              </div>
              <div className="rounded-full p-2 bg-blue-100">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
          onClick={() => setShowVouchers(true)}
        >
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-800">Vouchers Redeemed</p>
                <p className="text-xl font-bold text-green-900">{networkStats.totalVouchersUsed.toLocaleString()}</p>
                <p className="text-[11px] text-green-700">by members</p>
              </div>
              <div className="rounded-full p-2 bg-green-100">
                <Ticket className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => setShowScore(true)}
        >
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-800">Network Score</p>
                <p className="text-xl font-bold text-amber-900">{networkScore}</p>
                <p className="text-[11px] text-amber-700">Participation Points</p>
              </div>
              <div className="rounded-full p-2 bg-amber-100">
                <Medal className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
        <TabsList className="hidden sm:grid grid-cols-4 mb-6 h-auto">
          <TabsTrigger value="events" className="flex items-center gap-1.5 text-sm">
            <Calendar className="h-4 w-4" />
            <span>Event Info</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-1.5 text-sm">
            <ClipboardCheck className="h-4 w-4" />
            <span>Pending Events</span>
          </TabsTrigger>
          <TabsTrigger value="historical" className="flex items-center gap-1.5 text-sm">
            <Clock className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="messaging" className="flex items-center gap-1.5 text-sm">
            <MessageSquare className="h-4 w-4" />
            <span>Messaging</span>
          </TabsTrigger>
        </TabsList>

        <MobileFolderTabs
          tabs={[
            { value: "events", label: "Event Info", icon: Calendar },
            { value: "pending", label: "Pending", icon: ClipboardCheck },
            { value: "historical", label: "Analytics", icon: Clock },
            { value: "messaging", label: "Messages", icon: MessageSquare },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <TabsContent value="events">
          <ProviderEventInfo events={events} />
        </TabsContent>

        <TabsContent value="pending">
          <EventApprovalTab />
        </TabsContent>

        <TabsContent value="historical">
          <HistoricalEventsTab events={events} sortOrder={sortOrder} toggleSortOrder={toggleSortOrder} />
        </TabsContent>

        <TabsContent value="messaging">
          <MessagingTab />
        </TabsContent>
      </Tabs>

      {/* Network Members Dialog */}
      <Dialog open={showMembers} onOpenChange={setShowMembers}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Network Members ({networkStats.totalMembers})</DialogTitle>
            <DialogDescription>Members in your network who can redeem your vouchers</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold">{networkStats.totalMembers}</p>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold">{networkStats.totalVouchersUsed.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Redemptions</p>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium mb-2">Event Participation</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pending Events</span>
                  <Badge variant="outline">{pendingCount}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Upcoming Events</span>
                  <Badge variant="outline">{upcomingCount}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed Events</span>
                  <Badge variant="outline">{historicalCount}</Badge>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Voucher Usage Dialog */}
      <Dialog open={showVouchers} onOpenChange={setShowVouchers}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Voucher Usage ({networkStats.totalVouchersUsed.toLocaleString()})</DialogTitle>
            <DialogDescription>Breakdown of vouchers redeemed by deal type</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-3xl font-bold">{networkStats.totalVouchersUsed.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Vouchers Redeemed</p>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-primary" /> By Deal Type
              </p>
              {networkStats.dealBreakdown.map((deal) => {
                const pct = Math.round((deal.count / networkStats.totalVouchersUsed) * 100);
                return (
                  <div key={deal.type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{deal.type}</span>
                      <span className="font-medium">{deal.count} ({pct}%)</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Network Score Dialog */}
      <Dialog open={showScore} onOpenChange={setShowScore}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Network Score</DialogTitle>
            <DialogDescription>Your engagement and participation score</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/5">
              <div className="rounded-full p-3 bg-primary/10">
                <Medal className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{networkScore}</p>
                <p className="text-sm text-muted-foreground">Participation Points</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Level</span>
                <span className="font-medium">Gold Provider</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Level</span>
                <span className="font-medium">1,000 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Events Completed</span>
                <span className="font-medium">{historicalCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vouchers Redeemed</span>
                <span className="font-medium">{networkStats.totalVouchersUsed.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ProvidersDashboard;
