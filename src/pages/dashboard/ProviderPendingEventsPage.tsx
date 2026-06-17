
import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, ArrowUp, ArrowDown, Clock, Calendar, MapPin, Users, DollarSign, Percent, Gift, Tag, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ViewToggle from "@/components/ui/ViewToggle";
import PointsCircle from "@/components/ui/PointsCircle";
import EventDetailDialog from "@/components/ui/EventDetailDialog";
import { fetchProviderPendingEvents, ProviderPendingInvite, respondToProviderInvite } from "@/api/providerEvents";
import { getUserFromStorage } from "@/utils/userStorage";

const ProviderPendingEventsPage = () => {
  const [events, setEvents] = useState<ProviderPendingInvite[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedEvent, setSelectedEvent] = useState<ProviderPendingInvite | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approving, setApproving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const [pricingData, setPricingData] = useState({
    memberPrice: "",
    maxRedemptions: "",
    discountType: "none" as "none" | "percent" | "dollar" | "free_item",
    discountValue: "",
    freeItemDescription: "",
  });

  const resetPricing = () => {
    setPricingData({ memberPrice: "", maxRedemptions: "", discountType: "none", discountValue: "", freeItemDescription: "" });
  };

  useEffect(() => {
    let isMounted = true;

    const loadEvents = async () => {
      try {
        setLoading(true);
        setError("");
        const loadedEvents = await fetchProviderPendingEvents(getUserFromStorage()?.cognitoId);

        if (isMounted) {
          setEvents(loadedEvents);
        }
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Failed to load provider pending events";
        if (isMounted) {
          setError(message);
          toast({ title: "Could not load pending events", description: message, variant: "destructive" });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const dateA = new Date(a.eventDate || a.deadline).getTime();
      const dateB = new Date(b.eventDate || b.deadline).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
  }, [events, sortOrder]);

  const handleOpenApproval = (event: ProviderPendingInvite) => {
    setSelectedEvent(event);
    resetPricing();
    setShowApprovalDialog(true);
  };

  const handleApprove = async () => {
    if (!selectedEvent) return;

    if (pricingData.discountType === "none" && !pricingData.memberPrice.trim()) {
      toast({ title: "Member price required", description: "Enter a member price when no discount is selected.", variant: "destructive" });
      return;
    }

    if (pricingData.discountType !== "none" && pricingData.memberPrice.trim()) {
      toast({ title: "Remove member price", description: "Member price should only be entered when no discount is selected.", variant: "destructive" });
      return;
    }

    const voucherType =
      pricingData.discountType === "none"
        ? "N"
        : pricingData.discountType === "percent"
        ? "P"
        : pricingData.discountType === "dollar"
      ? "A"
      : "F";

    try {
      setApproving(true);
      const result = await respondToProviderInvite({
        inviteId: selectedEvent.inviteId,
        action: "approve",
        voucher: {
          type: voucherType,
          value: pricingData.discountValue,
          promoItem: pricingData.freeItemDescription,
          memberPrice: pricingData.memberPrice,
          maxRedemptions: pricingData.maxRedemptions,
        },
      });

      setEvents(prev => prev.filter(e => e.inviteId !== selectedEvent.inviteId));
      setShowApprovalDialog(false);
      setSelectedEvent(null);
      toast({
        title: result.alreadyApproved ? "Already approved" : "Event Approved",
        description: result.alreadyApproved
          ? `You already have a deal for "${selectedEvent.eventTitle}".`
          : `You've approved "${selectedEvent.eventTitle}" with your deal.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to approve event";
      toast({ title: "Approval failed", description: message, variant: "destructive" });
    } finally {
      setApproving(false);
    }
  };

  const handleDecline = async (event: ProviderPendingInvite) => {
    try {
      setApproving(true);
      await respondToProviderInvite({
        inviteId: event.inviteId,
        action: "decline",
      });
      setEvents(prev => prev.filter(e => e.inviteId !== event.inviteId));
      setSelectedEvent(null);
      setShowApprovalDialog(false);
      toast({ title: "Event Declined", description: `You declined "${event.eventTitle}".`, variant: "destructive" });
    } catch (declineError) {
      const message = declineError instanceof Error ? declineError.message : "Failed to decline event";
      toast({ title: "Decline failed", description: message, variant: "destructive" });
    } finally {
      setApproving(false);
    }
  };

  const handlePricingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPricingData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getStatusBadge = (status: ProviderPendingInvite["status"]) => {
    switch (status) {
      case "accepted":
        return <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">Accepted</Badge>;
      case "declined":
        return <Badge variant="outline" className="bg-red-50 text-red-700 text-xs">Declined</Badge>;
      case "expired":
        return <Badge variant="outline" className="bg-slate-100 text-slate-600 text-xs">Expired</Badge>;
      default:
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 text-xs">Pending</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-2 sm:space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="font-barlow font-bold text-xl sm:text-3xl text-foreground">Pending Approvals</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Events needing your approval</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">{events.length} pending</span>
            </div>
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={toggleSortOrder} className="flex items-center gap-0.5 text-[10px] sm:text-xs h-6 sm:h-8 px-2">
            <span>Date</span>
            {sortOrder === "asc" ? <ArrowUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <ArrowDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
          </Button>
        </div>

        {error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {loading ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">Loading pending approvals...</CardContent>
          </Card>
        ) : sortedEvents.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedEvents.map((event) => (
                <Card key={event.inviteId} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base font-semibold truncate">{event.eventTitle}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">{event.eventDescription}</CardDescription>
                      </div>
                      <PointsCircle points={event.networkPoints} />
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Partner</span>
                        <span className="text-foreground">{event.partnerName}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Location</span>
                        <span className="text-foreground">{event.location}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Date</span>
                        <span className="text-foreground">{event.eventDate}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Time</span>
                        <span className="text-foreground">{event.eventTime}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t">
                      <span className="text-xs font-medium text-foreground/60 uppercase tracking-wide">Deadline</span>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 text-xs">Due {event.deadline || "TBD"}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground/60 uppercase tracking-wide">Invite</span>
                      {getStatusBadge(event.status)}
                    </div>
                  </CardContent>
                  <div className="p-4 pt-0 flex gap-2">
                    <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleOpenApproval(event)}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleDecline(event)}>
                      <XCircle className="h-4 w-4 mr-1" /> Decline
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px]">Event</TableHead>
                        <TableHead className="text-[11px]">Partner</TableHead>
                        <TableHead className="text-[11px]">Location</TableHead>
                        <TableHead className="text-[11px]">Date</TableHead>
                        <TableHead className="text-[11px]">Deadline</TableHead>
                        <TableHead className="text-[11px]">Status</TableHead>
                        <TableHead className="text-[11px]">Points</TableHead>
                        <TableHead className="text-[11px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedEvents.map((event) => (
                        <TableRow key={event.inviteId} className="cursor-pointer hover:bg-muted/50" onClick={() => handleOpenApproval(event)}>
                          <TableCell className="py-2">
                            <div className="font-medium text-xs">{event.eventTitle}</div>
                            <div className="text-[11px] text-muted-foreground line-clamp-1">{event.eventDescription}</div>
                          </TableCell>
                          <TableCell className="text-xs py-2">{event.partnerName}</TableCell>
                          <TableCell className="text-xs py-2">{event.location}</TableCell>
                          <TableCell className="text-xs py-2 whitespace-nowrap">{event.eventDate}</TableCell>
                          <TableCell className="py-2">
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0">Due {event.deadline || "TBD"}</Badge>
                          </TableCell>
                          <TableCell className="py-2">{getStatusBadge(event.status)}</TableCell>
                          <TableCell className="py-2"><PointsCircle points={event.networkPoints} size="sm" /></TableCell>
                          <TableCell className="py-2">
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button size="sm" className="h-6 px-2 text-[10px] bg-green-600 hover:bg-green-700" onClick={() => handleOpenApproval(event)}>
                                <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Approve
                              </Button>
                              <Button size="sm" variant="destructive" className="h-6 px-2 text-[10px]" onClick={() => handleDecline(event)}>
                                <XCircle className="h-2.5 w-2.5 mr-0.5" /> Decline
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No pending events to review
            </CardContent>
          </Card>
        )}
      </div>

      {/* Approval Dialog with Pricing */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Approve Event</DialogTitle>
            <DialogDescription>Review event details and set your pricing before approving.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-3">
            {selectedEvent && (
              <div className="space-y-6">
                <div className="rounded-lg border p-4 space-y-3">
                  <h3 className="font-semibold text-lg">{selectedEvent.eventTitle}</h3>
                  <p className="text-sm text-muted-foreground">{selectedEvent.eventDescription}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>{selectedEvent.eventDate}</span></div>
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span>{selectedEvent.eventTime}</span></div>
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{selectedEvent.location}</span></div>
                    <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /><span>{selectedEvent.partnerName}</span></div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="outline">{selectedEvent.networkPoints} Network Points</Badge>
                    <Badge variant="outline" className="text-muted-foreground">Respond by {selectedEvent.deadline || "TBD"}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground/60 uppercase tracking-wide">Invite Status</span>
                    {getStatusBadge(selectedEvent.status)}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Your Pricing & Offer</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="memberPrice">Member Price ($)</Label>
                      <Input
                        id="memberPrice"
                        name="memberPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={pricingData.memberPrice}
                        onChange={handlePricingChange}
                        placeholder="0.00"
                        disabled={pricingData.discountType !== "none"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxRedemptions">Max Redemptions</Label>
                      <Input id="maxRedemptions" name="maxRedemptions" type="number" min="1" value={pricingData.maxRedemptions} onChange={handlePricingChange} placeholder="Unlimited" />
                      <p className="text-xs text-muted-foreground">Leave blank for unlimited</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Discount / Offer Type</Label>
                    <RadioGroup
                      value={pricingData.discountType}
                      onValueChange={(value) => setPricingData(prev => ({
                        ...prev,
                        discountType: value as typeof prev.discountType,
                        discountValue: "",
                        freeItemDescription: "",
                        memberPrice: value === "none" ? prev.memberPrice : "",
                      }))}
                      className="grid grid-cols-2 gap-3"
                    >
                      {[
                        { value: "none", label: "No Discount", icon: null },
                        { value: "percent", label: "% Off", icon: Percent },
                        { value: "dollar", label: "$ Amount Off", icon: DollarSign },
                        { value: "free_item", label: "Free Item", icon: Gift },
                      ].map((opt) => (
                        <label key={opt.value} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${pricingData.discountType === opt.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
                          <RadioGroupItem value={opt.value} />
                          {opt.icon && <opt.icon className="h-4 w-4 text-muted-foreground" />}
                          <span className="text-sm font-medium">{opt.label}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  {pricingData.discountType === "percent" && (
                    <div className="space-y-2">
                      <Label htmlFor="discountValue">Percentage Off (%)</Label>
                      <Input id="discountValue" name="discountValue" type="number" min="1" max="100" value={pricingData.discountValue} onChange={handlePricingChange} placeholder="e.g. 20" />
                    </div>
                  )}
                  {pricingData.discountType === "dollar" && (
                    <div className="space-y-2">
                      <Label htmlFor="discountValue">Amount Off ($)</Label>
                      <Input id="discountValue" name="discountValue" type="number" min="0.01" step="0.01" value={pricingData.discountValue} onChange={handlePricingChange} placeholder="e.g. 10.00" />
                    </div>
                  )}
                  {pricingData.discountType === "free_item" && (
                    <div className="space-y-2">
                      <Label htmlFor="freeItemDescription">Free Item Description</Label>
                      <Input id="freeItemDescription" name="freeItemDescription" value={pricingData.freeItemDescription} onChange={(e) => setPricingData(prev => ({ ...prev, freeItemDescription: e.target.value }))} placeholder="e.g. Free appetizer, Free tote bag" />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button className="flex-1" onClick={handleApprove} disabled={approving}>
                    <CheckCircle2 className="h-4 w-4 mr-2" /> {approving ? "Approving..." : "Approve Event"}
                  </Button>
                  <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDecline(selectedEvent)} disabled={approving}>
                    <XCircle className="h-4 w-4 mr-2" /> Decline
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ProviderPendingEventsPage;
