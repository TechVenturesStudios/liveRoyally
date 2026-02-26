import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, MapPin, Clock, Users, DollarSign, Percent, Gift, Tag, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PendingPartnerEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  networkPoints: number;
  deadline: string;
}

const mockPendingPartnerEvents: PendingPartnerEvent[] = [
  {
    id: "PE001",
    title: "Summer Market Festival",
    description: "A vibrant market showcasing local businesses and artisans. Partners are inviting providers to set up booths and offer exclusive deals to network members.",
    date: "2026-06-15",
    time: "10:00 AM - 4:00 PM",
    location: "Downtown Plaza",
    organizer: "City Community Foundation",
    networkPoints: 200,
    deadline: "2026-05-30",
  },
  {
    id: "PE002",
    title: "Business Networking Expo",
    description: "Connect with other businesses in the Royal Network. Offer exclusive discounts to attract new customers from the member base.",
    date: "2026-07-20",
    time: "6:00 PM - 9:00 PM",
    location: "Grand Hotel Conference Center",
    organizer: "Downtown Business Alliance",
    networkPoints: 150,
    deadline: "2026-07-01",
  },
  {
    id: "PE003",
    title: "Holiday Shopping Event",
    description: "Special holiday promotion event for local shops. Members receive vouchers to use at participating provider businesses.",
    date: "2026-12-10",
    time: "12:00 PM - 8:00 PM",
    location: "Shopping District",
    organizer: "City Community Foundation",
    networkPoints: 300,
    deadline: "2026-11-25",
  },
];

const EventApprovalTab = () => {
  const { toast } = useToast();
  const [pendingEvents, setPendingEvents] = useState(mockPendingPartnerEvents);
  const [selectedEvent, setSelectedEvent] = useState<PendingPartnerEvent | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);

  const [pricingData, setPricingData] = useState({
    memberPrice: "",
    maxRedemptions: "",
    discountType: "none" as "none" | "percent" | "dollar" | "free_item",
    discountValue: "",
    freeItemDescription: "",
  });

  const resetPricing = () => {
    setPricingData({
      memberPrice: "",
      maxRedemptions: "",
      discountType: "none",
      discountValue: "",
      freeItemDescription: "",
    });
  };

  const handleOpenApproval = (event: PendingPartnerEvent) => {
    setSelectedEvent(event);
    resetPricing();
    setShowApprovalDialog(true);
  };

  const handleApprove = () => {
    if (!selectedEvent) return;
    setPendingEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id));
    setShowApprovalDialog(false);
    toast({
      title: "Event Approved",
      description: `You've approved "${selectedEvent.title}" with your pricing details.`,
    });
  };

  const handleDecline = (event: PendingPartnerEvent) => {
    setPendingEvents((prev) => prev.filter((e) => e.id !== event.id));
    toast({
      title: "Event Declined",
      description: `You've declined "${event.title}".`,
      variant: "destructive",
    });
  };

  const handlePricingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPricingData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Event Approvals</CardTitle>
          <CardDescription>
            Review and approve events published by your partner organizations. Set your pricing and offer details before approving.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingEvents.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-primary/40" />
              <p className="font-medium">All caught up!</p>
              <p className="text-sm">No pending event approvals at this time.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>{event.organizer}</TableCell>
                      <TableCell>{event.date}</TableCell>
                      <TableCell>{event.location}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{event.networkPoints} pts</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{event.deadline}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" onClick={() => handleOpenApproval(event)}>
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDecline(event)}
                          >
                            Decline
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog with Pricing */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Approve Event</DialogTitle>
            <DialogDescription>
              Review event details and set your pricing before approving.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-3">
            {selectedEvent && (
              <div className="space-y-6">
                {/* Event Summary */}
                <div className="rounded-lg border p-4 space-y-3">
                  <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>
                  <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEvent.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEvent.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEvent.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEvent.organizer}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="outline">{selectedEvent.networkPoints} Network Points</Badge>
                    <Badge variant="outline" className="text-muted-foreground">
                      Respond by {selectedEvent.deadline}
                    </Badge>
                  </div>
                </div>

                {/* Pricing & Offers */}
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
                      />
                      <p className="text-xs text-muted-foreground">Enter 0 or leave blank for free</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxRedemptions">Max Redemptions</Label>
                      <Input
                        id="maxRedemptions"
                        name="maxRedemptions"
                        type="number"
                        min="1"
                        value={pricingData.maxRedemptions}
                        onChange={handlePricingChange}
                        placeholder="Unlimited"
                      />
                      <p className="text-xs text-muted-foreground">Leave blank for unlimited</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Discount / Offer Type</Label>
                    <RadioGroup
                      value={pricingData.discountType}
                      onValueChange={(value) =>
                        setPricingData((prev) => ({
                          ...prev,
                          discountType: value as typeof prev.discountType,
                          discountValue: "",
                          freeItemDescription: "",
                        }))
                      }
                      className="grid grid-cols-2 gap-3"
                    >
                      {[
                        { value: "none", label: "No Discount", icon: null },
                        { value: "percent", label: "% Off", icon: Percent },
                        { value: "dollar", label: "$ Amount Off", icon: DollarSign },
                        { value: "free_item", label: "Free Item", icon: Gift },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                            pricingData.discountType === opt.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/50"
                          }`}
                        >
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
                      <Input
                        id="discountValue"
                        name="discountValue"
                        type="number"
                        min="1"
                        max="100"
                        value={pricingData.discountValue}
                        onChange={handlePricingChange}
                        placeholder="e.g. 20"
                      />
                    </div>
                  )}

                  {pricingData.discountType === "dollar" && (
                    <div className="space-y-2">
                      <Label htmlFor="discountValue">Amount Off ($)</Label>
                      <Input
                        id="discountValue"
                        name="discountValue"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={pricingData.discountValue}
                        onChange={handlePricingChange}
                        placeholder="e.g. 10.00"
                      />
                    </div>
                  )}

                  {pricingData.discountType === "free_item" && (
                    <div className="space-y-2">
                      <Label htmlFor="freeItemDescription">Free Item Description</Label>
                      <Input
                        id="freeItemDescription"
                        name="freeItemDescription"
                        value={pricingData.freeItemDescription}
                        onChange={(e) =>
                          setPricingData((prev) => ({ ...prev, freeItemDescription: e.target.value }))
                        }
                        placeholder="e.g. Free appetizer, Free tote bag"
                      />
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1" onClick={handleApprove}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve Event
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      handleDecline(selectedEvent);
                      setShowApprovalDialog(false);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EventApprovalTab;
