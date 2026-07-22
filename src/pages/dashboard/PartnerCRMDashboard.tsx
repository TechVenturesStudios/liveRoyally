import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, BarChart3, Users, Edit, UserMinus, AlertTriangle, Crown, CalendarCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MessagingTab from "@/components/crm/MessagingTab";
import CampaignManagementTab from "@/components/crm/CampaignManagementTab";
import AccountManagementTab from "@/components/crm/AccountManagementTab";
import EventAnalyticsTab from "@/components/crm/EventAnalyticsTab";
import { fetchPartnerDashboardEvents, type PartnerDashboardEvent } from "@/api/partnerEvents";
import { fetchPartnerProviders, PartnerProvider } from "@/api/myProviders";
import { getUserFromStorage } from "@/utils/userStorage";
import MobileFolderTabs from "@/components/ui/MobileFolderTabs";

const partnerPlans = [
  { name: "Starter", maxProviders: 5, price: 29 },
  { name: "Growth", maxProviders: 15, price: 79 },
  { name: "Professional", maxProviders: 50, price: 149 },
  { name: "Enterprise", maxProviders: -1, price: 299 },
];

const currentPlan = partnerPlans[1];

interface ManagedProvider {
  id: string;
  displayId: string | null;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  category: string;
  joinDate: string;
  rating: number;
  engagementScore: number;
  lastActivity: string;
  businessName: string;
  businessCategory: string;
  businessCity: string;
  businessState: string;
  businessPhone: string;
  addedDate: string;
  hasActiveCampaign: boolean;
}

const PartnerCRMDashboard = () => {
  const [activeTab, setActiveTab] = useState("campaigns");
  const [showOpenCampaigns, setShowOpenCampaigns] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [showEventActivity, setShowEventActivity] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [providers, setProviders] = useState<ManagedProvider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [partnerEvents, setPartnerEvents] = useState<PartnerDashboardEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ type: "remove"; provider: ManagedProvider } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const loadProviders = async () => {
      try {
        setProvidersLoading(true);
        const user = getUserFromStorage();
        const loadedProviders = await fetchPartnerProviders(user?.cognitoId);
        const mappedProviders = loadedProviders.map((provider, index) => ({
          id: provider.id,
          displayId: provider.displayId ?? null,
          name: provider.businessName,
          contactName: `${provider.agentFirstName || ""} ${provider.agentLastName || ""}`.trim() || provider.businessEmail,
          email: provider.businessEmail,
          phone: provider.businessPhone,
          address: [provider.businessAddress, provider.businessCity, provider.businessState].filter(Boolean).join(", "),
          status: "active",
          category: provider.businessCategory,
          joinDate: provider.createdAt ? provider.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
          rating: 4,
          engagementScore: Math.max(35, 90 - index * 7),
          lastActivity: provider.createdAt ? provider.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
          businessName: provider.businessName,
          businessCategory: provider.businessCategory,
          businessCity: provider.businessCity,
          businessState: provider.businessState,
          businessPhone: provider.businessPhone,
          addedDate: provider.createdAt ? provider.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
          hasActiveCampaign: index < 2,
        }));

        if (isMounted) {
          setProviders(mappedProviders);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load providers";
        if (isMounted) {
          toast({ title: "Could not load providers", description: message, variant: "destructive" });
        }
      } finally {
        if (isMounted) {
          setProvidersLoading(false);
        }
      }
    };

    void loadProviders();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  useEffect(() => {
    let isMounted = true;

    const loadPartnerEvents = async () => {
      try {
        setEventsLoading(true);
        const user = getUserFromStorage();
        const loadedEvents = await fetchPartnerDashboardEvents(user?.cognitoId);
        if (isMounted) {
          setPartnerEvents(loadedEvents);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load partner events";
        if (isMounted) {
          toast({ title: "Could not load events", description: message, variant: "destructive" });
        }
      } finally {
        if (isMounted) {
          setEventsLoading(false);
        }
      }
    };

    void loadPartnerEvents();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const maxProviders = currentPlan.maxProviders;
  const usagePercent = maxProviders === -1 ? 0 : (providers.length / maxProviders) * 100;
  const remainingSlots = maxProviders === -1 ? Infinity : maxProviders - providers.length;

  const activeEvents = useMemo(
    () => partnerEvents.filter((event) => event.stage !== "past"),
    [partnerEvents]
  );
  const eventActivityPercent = partnerEvents.length > 0 ? Math.round((activeEvents.length / partnerEvents.length) * 100) : 0;

  const getDaysSinceAdded = (addedDate: string) => {
    const added = new Date(addedDate);
    const now = new Date();
    return Math.floor((now.getTime() - added.getTime()) / (1000 * 60 * 60 * 24));
  };

  const canRemove = (provider: ManagedProvider) => {
    if (provider.hasActiveCampaign) return { allowed: false, reason: "Provider has an active campaign" };
    if (getDaysSinceAdded(provider.addedDate) < 30) return { allowed: false, reason: `Must wait 30 days after adding (added ${provider.addedDate})` };
    return { allowed: true, reason: "" };
  };

  const handleRemoveClick = (provider: ManagedProvider) => {
    const check = canRemove(provider);
    if (!check.allowed) {
      toast({ title: "Cannot Remove Provider", description: check.reason, variant: "destructive" });
      return;
    }
    setConfirmAction({ type: "remove", provider });
  };

  const handleConfirmRemove = () => {
    if (!confirmAction) return;
    setProviders((prev) => prev.filter((p) => p.id !== confirmAction.provider.id));
    toast({ title: "Provider Removed", description: `${confirmAction.provider.businessName} has been removed from your network.` });
    setConfirmAction(null);
  };

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-bold royal-header">Partner CRM Dashboard</h1>
        <p className="text-muted-foreground text-xs sm:text-base mt-1 sm:mt-2">
          Manage your relationships with providers and track engagement
        </p>
      </div>

      <div className="flex sm:hidden gap-1.5 mb-4">
        <button
          className="flex-1 flex items-center gap-1 px-2 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors text-left"
          onClick={() => setShowProviders(true)}
        >
          <Users className="h-3 w-3 text-blue-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] font-medium text-blue-800 truncate">Providers</p>
            <p className="text-xs font-bold text-blue-900">{providers.length}</p>
          </div>
        </button>
        <button
          className="flex-1 flex items-center gap-1 px-2 py-1.5 rounded-md bg-green-50 hover:bg-green-100 transition-colors text-left"
          onClick={() => setShowOpenCampaigns(true)}
        >
          <BarChart3 className="h-3 w-3 text-green-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] font-medium text-green-800 truncate">Campaigns</p>
            <p className="text-xs font-bold text-green-900">{eventsLoading ? "..." : activeEvents.length}</p>
          </div>
        </button>
        <button
          className="flex-1 flex items-center gap-1 px-2 py-1.5 rounded-md bg-amber-50 hover:bg-amber-100 transition-colors text-left"
          onClick={() => setShowEventActivity(true)}
        >
          <CalendarCheck className="h-3 w-3 text-amber-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] font-medium text-amber-800 truncate">Event Activity</p>
            <p className="text-xs font-bold text-amber-900">{eventsLoading ? "..." : `${eventActivityPercent}%`}</p>
          </div>
        </button>
      </div>

      <div className="hidden sm:grid grid-cols-3 gap-3 mb-6">
        <Card className="bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => setShowProviders(true)}>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-800">Total Providers</p>
                <p className="text-xl font-bold text-blue-900">{providers.length}</p>
              </div>
              <div className="rounded-full p-2 bg-blue-100">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 cursor-pointer hover:bg-green-100 transition-colors" onClick={() => setShowOpenCampaigns(true)}>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-800">Open Campaigns</p>
                <p className="text-xl font-bold text-green-900">{eventsLoading ? "..." : activeEvents.length}</p>
              </div>
              <div className="rounded-full p-2 bg-green-100">
                <BarChart3 className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors" onClick={() => setShowEventActivity(true)}>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-800">Event Activity</p>
                <p className="text-xl font-bold text-amber-900">{eventsLoading ? "..." : `${eventActivityPercent}%`}</p>
                <p className="text-[11px] text-amber-700">Active events</p>
              </div>
              <div className="rounded-full p-2 bg-amber-100">
                <CalendarCheck className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} className="w-full" onValueChange={(value) => setActiveTab(value)}>
        <TabsList className="hidden sm:grid grid-cols-3 mb-6 h-auto">
          <TabsTrigger value="campaigns" className="flex items-center gap-1.5 text-sm">
            <BarChart3 className="h-4 w-4" />
            <span>Event Info</span>
          </TabsTrigger>
          <TabsTrigger value="event-analytics" className="flex items-center gap-1.5 text-sm">
            <CalendarCheck className="h-4 w-4" />
            <span>Event Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-1.5 text-sm">
            <Users className="h-4 w-4" />
            <span>Providers</span>
          </TabsTrigger>
          {/* <TabsTrigger value="messaging" className="flex items-center gap-1.5 text-sm">
            <MessageSquare className="h-4 w-4" />
            <span>Messaging</span>
          </TabsTrigger> */}
        </TabsList>

        <MobileFolderTabs
          tabs={[
            { value: "campaigns", label: "Events", icon: BarChart3 },
            { value: "event-analytics", label: "Analytics", icon: CalendarCheck },
            { value: "accounts", label: "Providers", icon: Users },
            // { value: "messaging", label: "Messages", icon: MessageSquare },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <TabsContent value="campaigns">
          <CampaignManagementTab />
        </TabsContent>

        <TabsContent value="event-analytics">
          <EventAnalyticsTab />
        </TabsContent>

        <TabsContent value="accounts">
          <AccountManagementTab providers={providers} loading={providersLoading} />
        </TabsContent>

        {/* <TabsContent value="messaging">
          <MessagingTab />
        </TabsContent> */}
      </Tabs>

      <Dialog open={showOpenCampaigns} onOpenChange={setShowOpenCampaigns}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Open Campaigns ({eventsLoading ? "..." : activeEvents.length})</DialogTitle>
            <DialogDescription>Active and upcoming events for this partner</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-3">
              {activeEvents.length > 0 ? (
                activeEvents.map((event) => (
                  <div key={event.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center gap-2">
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <Badge className={event.stage === "needs_approval" ? "bg-amber-100 text-amber-800 text-xs" : "bg-green-100 text-green-800 text-xs"}>
                        {event.stage === "needs_approval" ? "Needs Approval" : "Active"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {event.date ? new Date(event.date).toLocaleDateString() : "TBD"} - {event.location || "No location"}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Invites</span>
                        <span className="font-medium">{event.providerCount}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Approved</span>
                        <span className="font-medium">{event.acceptedProviderCount}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Pending</span>
                        <span className="font-medium">{event.pendingProviderCount}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-sm text-muted-foreground">No active events right now.</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={showEventActivity} onOpenChange={setShowEventActivity}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Activity ({eventActivityPercent}%)</DialogTitle>
            <DialogDescription>Active events compared with total events for this partner</DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Events</span>
              <span className="text-lg font-bold text-foreground">{activeEvents.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total Events</span>
              <span>{partnerEvents.length}</span>
            </div>
            <Progress value={eventActivityPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">{eventActivityPercent}% of this partner's events are active</p>
          </div>

          <ScrollArea className="h-[300px]">
            <div className="space-y-3 pr-3">
              {activeEvents.map((event) => (
                <div key={event.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <h4 className="font-medium text-sm">{event.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {event.stage === "needs_approval" ? "Needs Approval" : "Upcoming"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Invites</span>
                      <span className="font-medium">{event.providerCount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Approved</span>
                      <span className="font-medium">{event.acceptedProviderCount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Pending</span>
                      <span className="font-medium">{event.pendingProviderCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={showProviders} onOpenChange={(open) => { setShowProviders(open); if (!open) setIsEditMode(false); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div>
                <DialogTitle className="text-base">Your Providers ({providers.length})</DialogTitle>
                <DialogDescription className="text-xs">Manage providers in your network</DialogDescription>
              </div>
              <Button variant={isEditMode ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setIsEditMode(!isEditMode)}>
                <Edit className="h-3.5 w-3.5 mr-1" />
                {isEditMode ? "Done" : "Edit"}
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-1.5 px-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Crown className="h-3.5 w-3.5 text-primary" />
                {currentPlan.name} Plan
              </span>
              <span className="text-muted-foreground">
                {providers.length} / {maxProviders === -1 ? "∞" : maxProviders}
              </span>
            </div>
            {maxProviders !== -1 && <Progress value={usagePercent} className="h-1.5" />}
            {remainingSlots !== Infinity && remainingSlots <= 3 && (
              <p className="text-[11px] text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Only {remainingSlots} slot{remainingSlots !== 1 ? "s" : ""} remaining
              </p>
            )}
          </div>

          {isEditMode && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs space-y-1">
              <p className="font-medium text-amber-900 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Rules
              </p>
              <ul className="text-amber-800 list-disc list-inside space-y-0.5 text-[11px]">
                <li>Remove only when <strong>no active campaign</strong>.</li>
                <li>30-day cooldown on add/remove.</li>
                <li><strong>{currentPlan.name}</strong> plan: up to <strong>{maxProviders === -1 ? "unlimited" : maxProviders}</strong> providers.</li>
              </ul>
            </div>
          )}

          <ScrollArea className="h-[350px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Business</TableHead>
                  <TableHead className="text-xs">Contact</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Status</TableHead>
                  <TableHead className="text-xs text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium text-sm">{provider.businessName}</p>
                        <p className="text-[11px] text-muted-foreground">{provider.displayId || provider.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-sm">{provider.contactName}</p>
                        <p className="text-[11px] text-muted-foreground">{provider.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="text-[11px]">Active</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleRemoveClick(provider)}
                        disabled={!isEditMode}
                      >
                        <UserMinus className="h-3.5 w-3.5 mr-1" />
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {providers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                      No providers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove provider?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction ? `${confirmAction.provider.businessName} will be removed from your network.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemove}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default PartnerCRMDashboard;
