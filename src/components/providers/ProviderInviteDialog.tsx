import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Send, Plus, X, Crown, Users, ArrowUpCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const plans = [
  { name: "Starter", maxPartners: 5, price: 29 },
  { name: "Growth", maxPartners: 15, price: 79 },
  { name: "Professional", maxPartners: 50, price: 149 },
  { name: "Enterprise", maxPartners: -1, price: 299 },
];

export const mockCurrentPlan = plans[1];

const mockInvitedPartners = [
  { id: "1", name: "Downtown Chamber of Commerce", email: "info@downtownchamber.org", status: "active" },
  { id: "2", name: "Metro Business Alliance", email: "contact@metrobiz.org", status: "active" },
  { id: "3", name: "Local Arts Council", email: "hello@artscouncil.org", status: "active" },
  { id: "4", name: "Tech Innovators Hub", email: "admin@techhub.io", status: "pending" },
  { id: "5", name: "Green Valley Foundation", email: "outreach@greenvalley.org", status: "declined" },
];

interface ProviderInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProviderInviteDialog = ({ open, onOpenChange }: ProviderInviteDialogProps) => {
  const { toast } = useToast();
  const [emails, setEmails] = useState<string[]>([""]);
  const [message, setMessage] = useState(
    "Hi! We'd love to invite you to join our network on Live Royally. Together we can create amazing events and exclusive deals for our members."
  );

  const activePartners = mockInvitedPartners.filter((p) => p.status === "active").length;
  const pendingPartners = mockInvitedPartners.filter((p) => p.status === "pending").length;
  const maxPartners = mockCurrentPlan.maxPartners;
  const remainingSlots = maxPartners === -1 ? Infinity : maxPartners - activePartners;
  const usagePercent = maxPartners === -1 ? 0 : (activePartners / maxPartners) * 100;

  const addEmailField = () => setEmails((prev) => [...prev, ""]);
  const removeEmailField = (index: number) => setEmails((prev) => prev.filter((_, i) => i !== index));
  const updateEmail = (index: number, value: string) =>
    setEmails((prev) => prev.map((e, i) => (i === index ? value : e)));

  const handleSendInvites = () => {
    const validEmails = emails.filter((e) => e.trim() && e.includes("@"));
    if (validEmails.length === 0) {
      toast({ title: "No valid emails", description: "Please enter at least one valid email address.", variant: "destructive" });
      return;
    }
    if (remainingSlots !== Infinity && validEmails.length > remainingSlots) {
      toast({ title: "Plan limit reached", description: `You can only invite ${remainingSlots} more partner(s) on your current plan.`, variant: "destructive" });
      return;
    }
    toast({ title: "Invites Sent!", description: `${validEmails.length} invitation(s) sent successfully.` });
    setEmails([""]);
    onOpenChange(false);
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      case "pending": return <Clock className="h-3.5 w-3.5 text-amber-500" />;
      case "declined": return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      default: return null;
    }
  };

  const statusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "active": return "default";
      case "pending": return "secondary";
      case "declined": return "destructive";
      default: return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" /> Invite Partners
          </DialogTitle>
          <DialogDescription>Send email invitations to partners to join your network</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-3">
          <div className="space-y-4">
            {/* Plan stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Crown className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Plan</p>
                <p className="font-semibold text-sm">{mockCurrentPlan.name}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Partners</p>
                <p className="font-semibold text-sm">{activePartners}/{maxPartners === -1 ? "∞" : maxPartners}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <ArrowUpCircle className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="font-semibold text-sm">{remainingSlots === Infinity ? "∞" : remainingSlots}</p>
              </div>
            </div>

            {maxPartners !== -1 && <Progress value={usagePercent} className="h-2" />}

            {remainingSlots !== Infinity && remainingSlots <= 2 && (
              <Button variant="outline" size="sm" className="w-full">
                <ArrowUpCircle className="h-4 w-4 mr-1" /> Upgrade Plan for More Partners
              </Button>
            )}

            <Separator />

            {/* Email inputs */}
            <div className="space-y-2">
              <Label>Email Addresses</Label>
              {emails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => updateEmail(index, e.target.value)}
                    placeholder="partner@example.com"
                  />
                  {emails.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeEmailField(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addEmailField}>
                <Plus className="h-4 w-4 mr-1" /> Add Another
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Personal Message</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
            </div>

            <Separator />

            {/* Existing partners */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Current Partners</Label>
              <div className="space-y-2">
                {mockInvitedPartners.map((partner) => (
                  <div key={partner.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{partner.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{partner.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                      {statusIcon(partner.status)}
                      <Badge variant={statusVariant(partner.status)} className="capitalize text-xs">
                        {partner.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSendInvites}>
            <Send className="h-4 w-4 mr-2" /> Send Invitations
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderInviteDialog;
