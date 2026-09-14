
import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Search, UserPlus, UserMinus, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Representative {
  id: string;
  memberId?: string;
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
  authorizedRepresentativePartners: string[];
}

interface RepresentativesTabProps {
  representatives: Representative[];
  networkMembers: NetworkMember[];
  onAddRepresentative: (memberId: string) => void;
  onRemoveRepresentative?: (repId: string) => void;
  loading?: boolean;
}

const RepresentativesTab = ({ 
  representatives, 
  networkMembers, 
  onAddRepresentative,
  onRemoveRepresentative,
  loading = false,
}: RepresentativesTabProps) => {
  const PAGE_SIZE = 10;
  const [addMode, setAddMode] = useState<"search" | "email">("search");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberPage, setMemberPage] = useState(1);
  const [inviteEmail, setInviteEmail] = useState("");
  const { toast } = useToast();

  // Search only within the same network and rank exact/prefix matches ahead of loose matches.
  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return [];

    const getMatchScore = (value: string) => {
      const normalized = value.toLowerCase();
      if (normalized === q) return 0;
      if (normalized.startsWith(q)) return 1;
      if (normalized.split(/[\s.@_-]+/).some((part) => part.startsWith(q))) return 2;
      if (normalized.includes(q)) return 3;
      return Infinity;
    };

    return networkMembers
      .map((member, index) => ({
        member,
        score: Math.min(getMatchScore(member.name), getMatchScore(member.email)),
        index,
      }))
      .filter(({ score }) => score !== Infinity)
      .sort((a, b) => a.score - b.score || a.member.name.localeCompare(b.member.name) || a.index - b.index)
      .map(({ member }) => member);
  }, [networkMembers, memberSearch]);

  const totalMemberPages = Math.ceil(filteredMembers.length / PAGE_SIZE);
  const pagedMembers = filteredMembers.slice((memberPage - 1) * PAGE_SIZE, memberPage * PAGE_SIZE);

  const handleSelectMember = (memberId: string) => {
    onAddRepresentative(memberId);
    setMemberSearch("");
    setMemberPage(1);
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Loading representatives...
                    </TableCell>
                  </TableRow>
                ) : representatives.length > 0 ? representatives.map((rep) => (
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
                          }}
                        >
                          <UserMinus className="h-3.5 w-3.5 mr-1" /> Remove
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No representatives added yet.
                    </TableCell>
                  </TableRow>
                )}
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
                onChange={(e) => {
                  setMemberSearch(e.target.value);
                  setMemberPage(1);
                }}
                className="mb-3"
              />
              <div className="border rounded-md max-h-[240px] overflow-y-auto">
                {loading ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Loading network members...</p>
                ) : !memberSearch.trim() ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Search by name or email to find network members
                  </p>
                ) : filteredMembers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs">Email</TableHead>
                        <TableHead className="text-xs">Member Since</TableHead>
                        <TableHead className="text-xs">Also Represents</TableHead>
                        <TableHead className="text-xs text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedMembers.map((member) => {
                        const alreadyAdded = representatives.some((r) => r.memberId === member.id || r.id === member.id);
                        return (
                          <TableRow key={member.id}>
                            <TableCell className="text-sm font-medium">{member.name}</TableCell>
                            <TableCell className="text-sm">{member.email}</TableCell>
                            <TableCell className="text-sm">{member.memberSince}</TableCell>
                            <TableCell className="text-sm">
                              {member.authorizedRepresentativePartners.length > 0
                                ? member.authorizedRepresentativePartners.join(", ")
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              {alreadyAdded ? (
                                <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                  Added
                                </Badge>
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
                    No members found matching your search
                  </p>
                )}
              </div>
              {!loading && memberSearch.trim() && totalMemberPages > 1 && (
                <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
                  <span>
                    Showing {(memberPage - 1) * PAGE_SIZE + 1}–{Math.min(memberPage * PAGE_SIZE, filteredMembers.length)} of {filteredMembers.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2"
                      disabled={memberPage === 1}
                      onClick={() => setMemberPage((page) => Math.max(1, page - 1))}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-2">Page {memberPage} of {totalMemberPages}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 px-2"
                      disabled={memberPage === totalMemberPages}
                      onClick={() => setMemberPage((page) => Math.min(totalMemberPages, page + 1))}
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
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
