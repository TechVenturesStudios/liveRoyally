
import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Mail, Search, UserPlus, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Representative {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
}

interface NetworkMember {
  id: string;
  name: string;
  email: string;
  memberSince: string;
}

interface RepresentativesTabProps {
  representatives: Representative[];
  networkMembers: NetworkMember[];
  onAddRepresentative: (memberId: string) => void;
  onRemoveRepresentative?: (repId: string) => void;
}

const RepresentativesTab = ({ 
  representatives, 
  networkMembers, 
  onAddRepresentative,
  onRemoveRepresentative
}: RepresentativesTabProps) => {
  const [addMode, setAddMode] = useState<"search" | "email">("search");
  const [memberSearch, setMemberSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const { toast } = useToast();

  // Filter network members by search term (same network only)
  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return networkMembers;
    const q = memberSearch.toLowerCase();
    return networkMembers.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );
  }, [networkMembers, memberSearch]);

  const handleSelectMember = (memberId: string) => {
    onAddRepresentative(memberId);
    setMemberSearch("");
    toast({ title: "Representative Added", description: "Member has been added as a representative." });
  };

  const handleInviteByEmail = () => {
    const trimmed = inviteEmail.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    // In production this would send an invite
    toast({ title: "Invite Sent", description: `An invitation has been sent to ${trimmed}.` });
    setInviteEmail("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authorized Representatives</CardTitle>
        <CardDescription>Manage who can represent your business at events</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Current Representatives */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-3">Current Representatives</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {representatives.map((rep) => (
                  <TableRow key={rep.id}>
                    <TableCell className="font-medium">{rep.name}</TableCell>
                    <TableCell>{rep.email}</TableCell>
                    <TableCell>{rep.phone}</TableCell>
                    <TableCell>{rep.role}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {rep.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {onRemoveRepresentative && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            onRemoveRepresentative(rep.id);
                            toast({ title: "Representative Removed", description: `${rep.name} has been removed.` });
                          }}
                        >
                          <UserMinus className="h-3.5 w-3.5 mr-1" /> Remove
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Add New Representative */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-medium mb-3">Add New Representative</h3>

          <Tabs value={addMode} onValueChange={(v) => setAddMode(v as "search" | "email")}>
            <TabsList className="mb-4">
              <TabsTrigger value="search" className="gap-1.5">
                <Search className="h-3.5 w-3.5" /> Member Search
              </TabsTrigger>
              <TabsTrigger value="email" className="gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Invite by Email
              </TabsTrigger>
            </TabsList>

            {/* Member Search Tab */}
            <TabsContent value="search">
              <p className="text-xs text-muted-foreground mb-3">
                Search members in your network to add as a representative
              </p>
              <Input
                placeholder="Search by name or email…"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="mb-3"
              />
              <div className="border rounded-md max-h-[240px] overflow-y-auto">
                {filteredMembers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs">Email</TableHead>
                        <TableHead className="text-xs">Member Since</TableHead>
                        <TableHead className="text-xs text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member) => {
                        const alreadyAdded = representatives.some((r) => r.id === member.id);
                        return (
                          <TableRow key={member.id}>
                            <TableCell className="text-sm font-medium">{member.name}</TableCell>
                            <TableCell className="text-sm">{member.email}</TableCell>
                            <TableCell className="text-sm">{member.memberSince}</TableCell>
                            <TableCell className="text-right">
                              {alreadyAdded ? (
                                <Badge variant="outline" className="text-[10px]">Added</Badge>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => handleSelectMember(member.id)}>
                                  <UserPlus className="h-3.5 w-3.5 mr-1" /> Add
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {memberSearch ? "No members found matching your search" : "No network members available"}
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Email Invite Tab */}
            <TabsContent value="email">
              <p className="text-xs text-muted-foreground mb-3">
                Send an invite to someone by email to join as a representative
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address…"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInviteByEmail()}
                />
                <Button onClick={handleInviteByEmail} className="shrink-0">
                  <Mail className="h-4 w-4 mr-1.5" /> Send Invite
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default RepresentativesTab;
