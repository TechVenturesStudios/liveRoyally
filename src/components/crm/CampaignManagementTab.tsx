
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlusCircle, Calendar, Users, ChevronRight, BarChart3, Clock, Send, DollarSign, Percent, Gift, ArrowUpDown, CalendarDays, MapPin, Tag, CheckCircle2, Search, CheckCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { mockProviders } from "@/data/providerMockData";

// Events needing partner approval (providers have added pricing)
const needsApprovalEvents = [
  { id: "EVT-A1", title: "Holiday Health Fair", provider: "Sunrise Health Clinic", date: "2026-03-15", endDate: "2026-03-20", memberPrice: 15, discountType: "percent", discountValue: "20", maxRedemptions: 100, submittedDate: "2026-02-20" },
  { id: "EVT-A2", title: "Spring Fitness Challenge", provider: "Peak Performance Gym", date: "2026-04-01", endDate: "2026-04-15", memberPrice: 0, discountType: "free_item", discountValue: "Free session", maxRedemptions: 50, submittedDate: "2026-02-22" },
  { id: "EVT-A3", title: "Wellness Workshop", provider: "Mindful Therapy Group", date: "2026-03-28", endDate: "2026-04-05", memberPrice: 25, discountType: "dollar", discountValue: "10", maxRedemptions: 30, submittedDate: "2026-02-21" },
];

// Upcoming events (approved, not yet started)
const upcomingEvents = [
  { id: "EVT-U1", title: "Summer Wellness Program", startDate: "2026-06-01", endDate: "2026-08-31", providers: 18, status: "approved" },
  { id: "EVT-U2", title: "Fall Membership Drive", startDate: "2026-09-15", endDate: "2026-10-31", providers: 24, status: "approved" },
  { id: "EVT-U3", title: "New Provider Onboarding", startDate: "2026-05-01", endDate: "2026-07-31", providers: 8, status: "approved" },
];

// Past events (completed)
const pastEvents = [
  { id: "EVT-P1", title: "Spring Event Series", startDate: "2025-03-01", endDate: "2025-05-15", providers: 22, engagement: 78, vouchersRedeemed: 340 },
  { id: "EVT-P2", title: "Holiday Special Promotions", startDate: "2025-11-01", endDate: "2025-12-31", providers: 15, engagement: 65, vouchersRedeemed: 210 },
  { id: "EVT-P3", title: "Winter Wellness Week", startDate: "2025-01-15", endDate: "2025-01-22", providers: 10, engagement: 82, vouchersRedeemed: 150 },
];

const CampaignManagementTab = () => {
  const { toast } = useToast();
  const [showCreateEventDialog, setShowCreateEventDialog] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<typeof needsApprovalEvents[0] | null>(null);
  const [approvalEvents, setApprovalEvents] = useState(needsApprovalEvents);

  // Event creation form state
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    endDate: "",
    time: "",
    location: "",
    networkPoints: "",
    deadline: "",
  });
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<string>("businessName");
  const [sortAsc, setSortAsc] = useState(true);
  const [providerSearch, setProviderSearch] = useState("");

  const handleEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEventForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProviderToggle = (providerId: string) => {
    setSelectedProviders(prev =>
      prev.includes(providerId) ? prev.filter(id => id !== providerId) : [...prev, providerId]
    );
  };

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const sortedProviders = useMemo(() => {
    let filtered = [...mockProviders];
    if (providerSearch.trim()) {
      const q = providerSearch.toLowerCase();
      filtered = filtered.filter(p =>
        p.businessName.toLowerCase().includes(q) ||
        p.businessCategory.toLowerCase().includes(q) ||
        p.businessCity.toLowerCase().includes(q) ||
        `${p.agentFirstName} ${p.agentLastName}`.toLowerCase().includes(q)
      );
    }
    return filtered.sort((a, b) => {
      const aVal = (a as any)[sortKey] ?? "";
      const bVal = (b as any)[sortKey] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortAsc ? cmp : -cmp;
    });
  }, [sortKey, sortAsc, providerSearch]);

  const handleCreateEvent = () => {
    if (!eventForm.title || !eventForm.date || !eventForm.endDate || !eventForm.location || selectedProviders.length === 0) {
      toast({ title: "Missing Fields", description: "Please fill all required fields and select at least one provider.", variant: "destructive" });
      return;
    }
    toast({
      title: "Event Sent for Review",
      description: `"${eventForm.title}" has been sent to ${selectedProviders.length} provider(s) to add pricing details.`,
    });
    setEventForm({ title: "", description: "", date: "", endDate: "", time: "", location: "", networkPoints: "", deadline: "" });
    setSelectedProviders([]);
    setProviderSearch("");
    setShowCreateEventDialog(false);
  };

  const handleApproveEvent = (eventId: string) => {
    setApprovalEvents(prev => prev.filter(e => e.id !== eventId));
    setSelectedApproval(null);
    toast({ title: "Event Approved", description: "The event has been approved and will be visible to members on the start date." });
  };

  const handleRejectEvent = (eventId: string) => {
    setApprovalEvents(prev => prev.filter(e => e.id !== eventId));
    setSelectedApproval(null);
    toast({ title: "Pricing Rejected", description: "The event has been sent back to the provider for revised pricing.", variant: "destructive" });
  };

  const eventFilledSteps = [
    eventForm.title && eventForm.date && eventForm.endDate && eventForm.location,
    true,
    selectedProviders.length > 0,
  ].filter(Boolean).length;
  const eventProgress = Math.round((eventFilledSteps / 3) * 100);

  return (
    <div className="space-y-6">
      {/* Header: Event Info title + small Create Event button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-barlow font-bold">Event Info</h2>
        <Dialog open={showCreateEventDialog} onOpenChange={setShowCreateEventDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
              <PlusCircle className="h-3.5 w-3.5" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[85vh] p-0">
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle>Create Event</DialogTitle>
              <DialogDescription>Create an event and send it to providers. Providers will add pricing details, then you'll confirm before publishing.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(85vh-130px)] px-6 pb-2">
              <div className="space-y-6 pr-2">
                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="font-medium">{eventProgress}%</span>
                  </div>
                  <Progress value={eventProgress} className="h-1.5" />
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span className={eventForm.title && eventForm.date && eventForm.endDate && eventForm.location ? "text-primary font-medium" : ""}>① Details</span>
                    <span className="text-muted-foreground/50">② Pricing (Provider)</span>
                    <span className={selectedProviders.length > 0 ? "text-primary font-medium" : ""}>③ Providers</span>
                  </div>
                </div>

                {/* Step 1: Event Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Event Details
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="evt-title">Event Title <span className="text-destructive">*</span></Label>
                    <Input id="evt-title" name="title" value={eventForm.title} onChange={handleEventChange} placeholder="e.g. Summer Market Festival" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="evt-desc">Description</Label>
                    <Textarea id="evt-desc" name="description" value={eventForm.description} onChange={handleEventChange} placeholder="What is this event about..." rows={2} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="evt-date">Start Date <span className="text-destructive">*</span></Label>
                      <Input id="evt-date" name="date" type="date" value={eventForm.date} onChange={handleEventChange} />
                      <p className="text-[11px] text-muted-foreground">Members see this event once the start date begins</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="evt-endDate">End Date <span className="text-destructive">*</span></Label>
                      <Input id="evt-endDate" name="endDate" type="date" value={eventForm.endDate} onChange={handleEventChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="evt-time">Time</Label>
                      <Input id="evt-time" name="time" value={eventForm.time} onChange={handleEventChange} placeholder="e.g. 10:00 AM - 4:00 PM" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="evt-location">Location <span className="text-destructive">*</span></Label>
                      <Input id="evt-location" name="location" value={eventForm.location} onChange={handleEventChange} placeholder="e.g. Downtown Plaza" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="evt-points">Network Points</Label>
                      <Input id="evt-points" name="networkPoints" type="number" value={eventForm.networkPoints} onChange={handleEventChange} placeholder="e.g. 200" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="evt-deadline">Provider Response Deadline</Label>
                      <Input id="evt-deadline" name="deadline" type="date" value={eventForm.deadline} onChange={handleEventChange} />
                    </div>
                  </div>
                </div>

                {/* Step 2: Pricing (Greyed out for partners) */}
                <div className="space-y-4 relative">
                  <div className="absolute inset-0 bg-background/60 z-10 rounded-lg flex items-center justify-center">
                    <div className="bg-muted border rounded-lg px-4 py-3 text-center max-w-[280px]">
                      <Tag className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
                      <p className="text-sm font-medium text-foreground">Provider Responsibility</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Pricing & offers will be filled in by providers after they receive the event invitation.</p>
                    </div>
                  </div>
                  <div className="opacity-40 pointer-events-none space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-muted-foreground text-xs font-bold">2</div>
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      Pricing & Offers
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Member Price ($)</Label>
                        <Input disabled placeholder="0.00" />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Redemptions</Label>
                        <Input disabled placeholder="Unlimited" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Discount / Offer Type</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {["No Discount", "% Off", "$ Off", "Free Item"].map((label) => (
                          <div key={label} className="flex items-center gap-2 p-2.5 rounded-lg border border-border text-xs font-medium text-muted-foreground">{label}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Select Providers */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
                    <Users className="h-4 w-4 text-primary" />
                    Select Providers
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search providers..." value={providerSearch} onChange={(e) => setProviderSearch(e.target.value)} className="pl-9 h-8 text-sm" />
                    </div>
                    {selectedProviders.length > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {selectedProviders.length} selected
                      </div>
                    )}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden md:block rounded-lg border overflow-hidden max-h-[200px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          {[
                            { key: "businessName", label: "Business" },
                            { key: "businessCategory", label: "Category" },
                            { key: "businessCity", label: "City" },
                          ].map((col) => (
                            <TableHead key={col.key} className="cursor-pointer select-none hover:text-foreground text-xs" onClick={() => handleSort(col.key)}>
                              <span className="inline-flex items-center gap-1">{col.label}<ArrowUpDown className={`h-3 w-3 ${sortKey === col.key ? "text-primary" : "text-muted-foreground"}`} /></span>
                            </TableHead>
                          ))}
                          <TableHead className="text-right text-xs">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedProviders.length === 0 ? (
                          <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground text-xs">No providers found.</TableCell></TableRow>
                        ) : sortedProviders.map((provider) => {
                          const isSelected = selectedProviders.includes(provider.id);
                          return (
                            <TableRow key={provider.id} className={isSelected ? "bg-primary/5" : ""}>
                              <TableCell className="font-medium text-xs py-1.5">{provider.businessName}</TableCell>
                              <TableCell className="text-xs py-1.5">{provider.businessCategory}</TableCell>
                              <TableCell className="text-xs py-1.5">{provider.businessCity}</TableCell>
                              <TableCell className="text-right py-1.5">
                                <Button type="button" size="sm" variant={isSelected ? "outline" : "default"} className={`h-6 text-[11px] px-2 ${isSelected ? "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" : "bg-green-600 hover:bg-green-700 text-white"}`} onClick={() => handleProviderToggle(provider.id)}>
                                  {isSelected ? "Remove" : "Select"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-2 max-h-[200px] overflow-y-auto">
                    {sortedProviders.length === 0 ? (
                      <p className="text-center py-4 text-muted-foreground text-xs">No providers found.</p>
                    ) : sortedProviders.map((provider) => {
                      const isSelected = selectedProviders.includes(provider.id);
                      return (
                        <div key={provider.id} className={`rounded-lg border p-2.5 ${isSelected ? "border-primary bg-primary/5" : ""}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-xs truncate">{provider.businessName}</p>
                              <p className="text-[11px] text-muted-foreground">{provider.businessCategory} • {provider.businessCity}</p>
                            </div>
                            <Button type="button" size="sm" variant={isSelected ? "outline" : "default"} className={`shrink-0 h-6 text-[11px] px-2 ${isSelected ? "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" : "bg-green-600 hover:bg-green-700 text-white"}`} onClick={() => handleProviderToggle(provider.id)}>
                              {isSelected ? "Remove" : "Select"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="px-6 py-4 border-t">
              <div className="flex items-center justify-between w-full gap-3">
                <span className="text-xs text-muted-foreground">
                  {selectedProviders.length === 0 ? "Select at least one provider" : `${selectedProviders.length} provider(s) selected`}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowCreateEventDialog(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleCreateEvent} disabled={!eventForm.title || !eventForm.date || !eventForm.endDate || !eventForm.location || selectedProviders.length === 0}>
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Send to Providers
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Needs Approval section */}
      {approvalEvents.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-amber-100">
                <CheckCircle className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <CardTitle className="text-sm">Needs Your Approval</CardTitle>
              <Badge variant="secondary" className="text-xs ml-auto bg-amber-100 text-amber-800">{approvalEvents.length}</Badge>
            </div>
            <CardDescription className="text-xs">Events where providers have submitted pricing — review and confirm</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {approvalEvents.map(evt => (
                <div key={evt.id} className="border rounded-lg p-3 bg-background cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setSelectedApproval(evt)}>
                  <div className="flex justify-between items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm">{evt.title}</h3>
                    <Badge className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0 shrink-0">Pending Approval</Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    <span>Provider: {evt.provider}</span>
                    <span>{new Date(evt.date).toLocaleDateString()} – {new Date(evt.endDate).toLocaleDateString()}</span>
                    <span>Price: {evt.memberPrice === 0 ? "Free" : `$${evt.memberPrice}`}</span>
                    <span>Submitted: {new Date(evt.submittedDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Upcoming Events & Past Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-blue-100">
                <Calendar className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <CardTitle className="text-sm">Upcoming Events</CardTitle>
              <Badge variant="secondary" className="text-xs ml-auto">{upcomingEvents.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ScrollArea className="h-[220px]">
              <div className="space-y-2 pr-2">
                {upcomingEvents.map(evt => (
                  <div key={evt.id} className="border rounded-lg p-2.5">
                    <div className="flex justify-between items-center gap-2 mb-1">
                      <h3 className="font-medium text-xs truncate">{evt.title}</h3>
                      <Badge className="bg-blue-100 text-blue-800 shrink-0 text-[10px] px-1.5 py-0">Upcoming</Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground mb-1">
                      {new Date(evt.startDate).toLocaleDateString()} – {new Date(evt.endDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{evt.providers} providers</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-muted">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <CardTitle className="text-sm">Past Events</CardTitle>
              <Badge variant="secondary" className="text-xs ml-auto">{pastEvents.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ScrollArea className="h-[220px]">
              <div className="space-y-2 pr-2">
                {pastEvents.map(evt => (
                  <div key={evt.id} className="border rounded-lg p-2.5">
                    <div className="flex justify-between items-center gap-2 mb-1">
                      <h3 className="font-medium text-xs truncate">{evt.title}</h3>
                      <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">Completed</Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground mb-1">
                      {new Date(evt.startDate).toLocaleDateString()} – {new Date(evt.endDate).toLocaleDateString()}
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{evt.providers} providers</span>
                      <span>Engagement: {evt.engagement}%</span>
                      <span>Vouchers: {evt.vouchersRedeemed}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Approval Detail Dialog */}
      <Dialog open={!!selectedApproval} onOpenChange={(open) => !open && setSelectedApproval(null)}>
        <DialogContent className="sm:max-w-[450px] max-h-[85vh]">
          {selectedApproval && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">{selectedApproval.title}</DialogTitle>
                <DialogDescription className="text-xs">Review provider-submitted pricing before publishing</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-3 pr-3">
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Event Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-xs text-muted-foreground block">Provider</span><span className="font-medium text-xs">{selectedApproval.provider}</span></div>
                      <div><span className="text-xs text-muted-foreground block">Dates</span><span className="font-medium text-xs">{new Date(selectedApproval.date).toLocaleDateString()} – {new Date(selectedApproval.endDate).toLocaleDateString()}</span></div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-primary">Provider Pricing (Review Required)</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-xs text-muted-foreground block">Member Price</span><span className="font-medium text-xs">{selectedApproval.memberPrice === 0 ? "Free" : `$${selectedApproval.memberPrice}`}</span></div>
                      <div><span className="text-xs text-muted-foreground block">Max Redemptions</span><span className="font-medium text-xs">{selectedApproval.maxRedemptions}</span></div>
                      <div><span className="text-xs text-muted-foreground block">Discount Type</span><span className="font-medium text-xs capitalize">{selectedApproval.discountType.replace("_", " ")}</span></div>
                      <div><span className="text-xs text-muted-foreground block">Discount Value</span><span className="font-medium text-xs">{selectedApproval.discountType === "percent" ? `${selectedApproval.discountValue}%` : selectedApproval.discountType === "dollar" ? `$${selectedApproval.discountValue}` : selectedApproval.discountValue}</span></div>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Submitted by provider on {new Date(selectedApproval.submittedDate).toLocaleDateString()}</p>
                </div>
              </ScrollArea>
              <DialogFooter className="gap-2">
                <Button variant="outline" size="sm" className="text-xs text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleRejectEvent(selectedApproval.id)}>
                  Reject & Return
                </Button>
                <Button size="sm" className="text-xs" onClick={() => handleApproveEvent(selectedApproval.id)}>
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                  Approve & Publish
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignManagementTab;
