import React, { useEffect, useState } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import { fetchRepresentativeAssignments, respondToRepresentativeInvite, type RepresentativeAssignment } from "@/api/authorizedRepresentatives";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const MemberRepresentativeInvites = () => {
  const [invites, setInvites] = useState<RepresentativeAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    fetchRepresentativeAssignments()
      .then((result) => {
        if (!cancelled) setInvites(result.assignments.filter((assignment) => assignment.status === "pending"));
      })
      .catch((error) => console.error("failed to load representative invites:", error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const respond = async (invite: RepresentativeAssignment, action: "accept" | "decline") => {
    setRespondingId(invite.assignmentId);
    try {
      await respondToRepresentativeInvite(invite.assignmentId, action);
      setInvites((current) => current.filter((item) => item.assignmentId !== invite.assignmentId));
      toast({
        title: action === "accept" ? "Representative invite accepted" : "Representative invite declined",
        description: action === "accept"
          ? `You can now represent ${invite.representedName}.`
          : `You will not represent ${invite.representedName}.`,
      });
    } catch (error) {
      toast({ title: "Could not update invite", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setRespondingId(null);
    }
  };

  if (loading || invites.length === 0) return null;

  return (
    <Card className="mb-6 border-amber-200 bg-amber-50/40">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-amber-100 p-2 text-amber-700"><ShieldCheck className="h-5 w-5" /></div>
          <div>
            <CardTitle className="text-base">Authorized representative invitations</CardTitle>
            <CardDescription>Review these requests before you can represent another account.</CardDescription>
          </div>
          <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-800">{invites.length} pending</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {invites.map((invite) => (
          <div key={invite.assignmentId} className="flex flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{invite.representedName}</p>
              <p className="text-sm text-muted-foreground">
                {invite.representedNetworkName ? `${invite.representedNetworkName} · ` : ""}invited you to be an authorized representative
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => respond(invite, "accept")} disabled={respondingId === invite.assignmentId}>
                <Check className="mr-1.5 h-4 w-4" /> Accept
              </Button>
              <Button size="sm" variant="outline" onClick={() => respond(invite, "decline")} disabled={respondingId === invite.assignmentId}>
                <X className="mr-1.5 h-4 w-4" /> Decline
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MemberRepresentativeInvites;
