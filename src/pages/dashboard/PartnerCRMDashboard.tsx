
import React, { useState } from "react";
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
import { MessageSquare, BarChart3, Users, MapPin, Phone, Edit, UserMinus, AlertTriangle, Crown, Calendar, CalendarCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MessagingTab from "@/components/crm/MessagingTab";
import CampaignManagementTab from "@/components/crm/CampaignManagementTab";
import AccountManagementTab from "@/components/crm/AccountManagementTab";
import EventAnalyticsTab from "@/components/crm/EventAnalyticsTab";
import { mockProviders } from "@/data/providerMockData";
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
  businessName: string;
  businessCategory: string;
  businessCity: string;
  businessState: string;
  businessPhone: string;
  addedDate: string;
  hasActiveCampaign: boolean;
}

const initialManagedProviders: ManagedProvider[] = mockProviders.map((p, i) => ({
  id: p.id,
  businessName: p.businessName,
  businessCategory: p.businessCategory,
  businessCity: p.businessCity,
  businessState: p.businessState,
  businessPhone: p.businessPhone,
  addedDate: i === 0 ? "2026-02-20" : i === 1 ? "2026-01-10" : "2025-12-01",
  hasActiveCampaign: i < 2,
}));

// Open campaigns from CampaignManagementTab mock data
const openCampaigns = [
  { id: 1, name: "Summer Wellness Program", type: "Email", status: "active", startDate: "2025-06-01", endDate: "2025-08-31", providers: 18, engagement: 72, budget: 1500, spent: 850 },
  { id: 2, name: "Fall Membership Drive", type: "Multi-channel", status: "planned", startDate: "2025-09-15", endDate: "2025-10-31", providers: 24, engagement: 0, budget: 2000, spent: 0 },
  { id: 3, name: "Holiday Special Promotions", type: "Social Media", status: "active", startDate: "2025-11-01", endDate: "2025-12-31", providers: 15, engagement: 65, budget: 1200, spent: 600 },
  { id: 4, name: "New Provider Onboarding", type: "Email", status: "active", startDate: "2025-05-01", endDate: "2025-07-31", providers: 8, engagement: 85, budget: 800, spent: 650 },
];


const PartnerCRMDashboard = () => {
  const [activeTab, setActiveTab] = useState("campaigns");
  const [showOpenCampaigns, setShowOpenCampaigns] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [showRevenue, setShowRevenue] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [providers, setProviders] = useState<ManagedProvider[]>(initialManagedProviders);
  const [confirmAction, setConfirmAction] = useState<{ type: "remove"; provider: ManagedProvider } | null>(null);
  const { toast } = useToast();

  const maxProviders = currentPlan.maxProviders;
  const usagePercent = maxProviders === -1 ? 0 : (providers.length / maxProviders) * 100;
  const remainingSlots = maxProviders === -1 ? Infinity : maxProviders - providers.length;
  const totalBudget = openCampaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = openCampaigns.reduce((sum, c) => sum + c.spent, 0);
  const revenuePercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

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
      
      {/* Mobile: compact horizontal buttons */}
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
            <p className="text-xs font-bold text-green-900">{openCampaigns.length}</p>
          </div>
        </button>
        <button
          className="flex-1 flex items-center gap-1 px-2 py-1.5 rounded-md bg-amber-50 hover:bg-amber-100 transition-colors text-left"
          onClick={() => setShowRevenue(true)}
        >
          <CalendarCheck className="h-3 w-3 text-amber-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] font-medium text-amber-800 truncate">Event Analytics</p>
            <p className="text-xs font-bold text-amber-900">{revenuePercent}% revenue earned</p>
          </div>
        </button>
      </div>

      {/* Desktop: full KPI cards */}
      <div className="hidden sm:grid grid-cols-3 gap-3 mb-6">
        <Card
          className="bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => setShowProviders(true)}
        >
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
        
        <Card
          className="bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
          onClick={() => setShowOpenCampaigns(true)}
        >
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-800">Open Campaigns</p>
                <p className="text-xl font-bold text-green-900">{openCampaigns.length}</p>
              </div>
              <div className="rounded-full p-2 bg-green-100">
                <BarChart3 className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card
          className="bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => setShowRevenue(true)}
        >
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-800">Event Analytics</p>
                <p className="text-xl font-bold text-amber-900">{revenuePercent}%</p>
                <p className="text-[11px] text-amber-700">Revenue Earned</p>
              </div>
              <div className="rounded-full p-2 bg-amber-100">
                <CalendarCheck className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs 
        value={activeTab}
        className="w-full"
        onValueChange={(value) => setActiveTab(value)}
      >
        {/* Desktop tabs */}
        <TabsList className="hidden sm:grid grid-cols-4 mb-6 h-auto">
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
          <TabsTrigger value="messaging" className="flex items-center gap-1.5 text-sm">
            <MessageSquare className="h-4 w-4" />
            <span>Messaging</span>
          </TabsTrigger>
        </TabsList>

        {/* Mobile folder tabs */}
        <MobileFolderTabs
          tabs={[
            { value: "campaigns", label: "Events", icon: BarChart3 },
            { value: "event-analytics", label: "Analytics", icon: CalendarCheck },
            { value: "accounts", label: "Providers", icon: Users },
            { value: "messaging", label: "Messages", icon: MessageSquare },
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
          <AccountManagementTab />
        </TabsContent>

        <TabsContent value="messaging">
          <MessagingTab />
        </TabsContent>
      </Tabs>

      {/* Open Campaigns Dialog */}
      <Dialog open={showOpenCampaigns} onOpenChange={setShowOpenCampaigns}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Open Campaigns ({openCampaigns.length})</DialogTitle>
            <DialogDescription>Active and planned campaigns</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-3">
              {openCampaigns.map(campaign => (
                <div key={campaign.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <h4 className="font-medium text-sm">{campaign.name}</h4>
                    <Badge className={campaign.status === "active" ? "bg-green-100 text-green-800 text-xs" : "bg-blue-100 text-blue-800 text-xs"}>
                      {campaign.status === "active" ? "Active" : "Planned"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()} · {campaign.type}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Providers</span>
                      <span className="font-medium">{campaign.providers}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Budget</span>
                      <span className="font-medium">${campaign.budget.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Spent</span>
                      <span className="font-medium">${campaign.spent.toLocaleString()}</span>
                    </div>
                  </div>
                  {campaign.status === "active" && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Engagement</span>
                        <span className="font-medium">{campaign.engagement}%</span>
                      </div>
                      <Progress value={campaign.engagement} className="h-1.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Provider List Dialog */}
      <Dialog open={showProviders} onOpenChange={(open) => { setShowProviders(open); if (!open) setIsEditMode(false); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div>
                <DialogTitle className="text-base">Your Providers ({providers.length})</DialogTitle>
                <DialogDescription className="text-xs">Manage providers in your network</DialogDescription>
              </div>
              <Button
                variant={isEditMode ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setIsEditMode(!isEditMode)}
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                {isEditMode ? "Done" : "Edit"}
              </Button>
            </div>
          </DialogHeader>

          {/* Plan usage bar */}
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
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">Location</TableHead>
                  {isEditMode ? <TableHead className="text-xs">Status</TableHead> : <TableHead className="text-xs">Contact</TableHead>}
                  {isEditMode && <TableHead className="text-xs w-[60px]">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((provider) => {
                  const removeCheck = canRemove(provider);
                  const daysSinceAdded = getDaysSinceAdded(provider.addedDate);
                  return (
                    <TableRow key={provider.id}>
                      <TableCell className="font-medium text-xs py-2">{provider.businessName}</TableCell>
                      <TableCell className="text-xs py-2">{provider.businessCategory}</TableCell>
                      <TableCell className="py-2">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {provider.businessCity}, {provider.businessState}
                        </span>
                      </TableCell>
                      {isEditMode ? (
                        <TableCell className="py-2">
                          <div className="space-y-0.5">
                            {provider.hasActiveCampaign && (
                              <p className="text-[10px] font-medium text-green-700">Active Campaign</p>
                            )}
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {daysSinceAdded}d ago
                            </p>
                          </div>
                        </TableCell>
                      ) : (
                        <TableCell className="py-2">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {provider.businessPhone}
                          </span>
                        </TableCell>
                      )}
                      {isEditMode && (
                        <TableCell className="py-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={!removeCheck.allowed}
                            title={removeCheck.allowed ? "Remove provider" : removeCheck.reason}
                            onClick={() => handleRemoveClick(provider)}
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Remove Provider?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You are about to remove <strong>{confirmAction?.provider.businessName}</strong> from your network.
                </p>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 space-y-1">
                  <p className="font-medium">Please confirm you understand:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>This provider <strong>cannot be re-added for 30 days</strong> after removal.</li>
                    <li>Any pending event invitations for this provider will be cancelled.</li>
                    <li>This action cannot be undone immediately.</li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Remove Provider
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revenue Earned Dialog */}
      <Dialog open={showRevenue} onOpenChange={setShowRevenue}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revenue Earned ({revenuePercent}%)</DialogTitle>
            <DialogDescription>Campaign revenue breakdown — ${totalSpent.toLocaleString()} earned of ${totalBudget.toLocaleString()} target</DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Revenue Earned</span>
              <span className="text-lg font-bold text-foreground">${totalSpent.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Target Revenue</span>
              <span>${totalBudget.toLocaleString()}</span>
            </div>
            <Progress value={revenuePercent} className="h-2" />
            <p className="text-xs text-muted-foreground">{revenuePercent}% of target achieved</p>
          </div>

          <ScrollArea className="h-[300px]">
            <div className="space-y-3 pr-3">
              {openCampaigns.map(campaign => {
                const campPercent = campaign.budget > 0 ? Math.round((campaign.spent / campaign.budget) * 100) : 0;
                return (
                  <div key={campaign.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center gap-2">
                      <h4 className="font-medium text-sm">{campaign.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {campaign.status === "active" ? "Active" : "Planned"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Earned</span>
                        <span className="font-medium">${campaign.spent.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Target</span>
                        <span className="font-medium">${campaign.budget.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">% Earned</span>
                        <span className="font-medium">{campPercent}%</span>
                      </div>
                    </div>
                    <Progress value={campPercent} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
};

export default PartnerCRMDashboard;
