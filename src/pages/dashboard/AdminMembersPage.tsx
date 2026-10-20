
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ViewToggle from "@/components/ui/ViewToggle";
import EventDetailDialog from "@/components/ui/EventDetailDialog";
import { Users, ArrowLeft, UserCheck, Mail, MapPin, CalendarDays } from "lucide-react";
import { fetchAdminMembers, type AdminMember } from "@/api/adminMembers";
import { getUserFromStorage } from "@/utils/userStorage";

const AdminMembersPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || "/dashboard/admin/analytics";
  const backLabel = from.includes("analytics") ? "Back to Analytics" : "Back to Home";
  const { isLoading } = useAuthCheck();
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [statusFilter, setStatusFilter] = useState<"all" | "active">("all");
  const [selectedMember, setSelectedMember] = useState<AdminMember | null>(null);

  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;
    fetchAdminMembers(getUserFromStorage()?.cognitoId)
      .then((result) => { if (!cancelled) setMembers(result.members); })
      .catch((error) => { if (!cancelled) setMembersError(error instanceof Error ? error.message : "Failed to load members"); })
      .finally(() => { if (!cancelled) setMembersLoading(false); });
    return () => { cancelled = true; };
  }, [isLoading]);

  if (isLoading || membersLoading) return <LoadingSpinner />;

  const activeCount = members.filter((m) => m.status === "active").length;
  const filteredMembers = statusFilter === "active"
    ? members.filter((m) => m.status === "active")
    : [...members].sort((a, b) => {
        if (a.status === "inactive" && b.status === "active") return -1;
        if (a.status === "active" && b.status === "inactive") return 1;
        return 0;
      });

  const getDetailRows = (m: AdminMember) => [
    { label: "Name", value: `${m.firstName} ${m.lastName}` },
    { label: "Email", value: m.email },
    { label: "Network", value: m.network },
    { label: "Network Code", value: m.networkCode },
    { label: "Zip Code", value: m.zipCode },
    { label: "Status", value: <Badge variant={m.status === "active" ? "default" : "secondary"}>{m.status}</Badge> },
    { label: "Engagement Score", value: String(m.engagementScore) },
    { label: "Join Date", value: new Date(m.joinDate).toLocaleDateString() },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2 h-7 text-xs"
          onClick={() => navigate(from)}
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-barlow font-bold text-2xl sm:text-3xl text-foreground mb-1">
              All Members
            </h1>
            <p className="text-sm text-muted-foreground">
              Platform-wide member directory across all networks
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setStatusFilter("active")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium transition-colors ${
                statusFilter === "active"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              {activeCount} active
            </button>
            <button
              onClick={() => setStatusFilter("all")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium transition-colors ${
                statusFilter === "all"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              {members.length} total
            </button>
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>
        </div>

        {membersError ? (
          <Card><div className="py-4 px-5 text-sm text-destructive">{membersError}</div></Card>
        ) : filteredMembers.length === 0 ? (
          <Card><div className="py-10 text-center text-sm text-muted-foreground">No members found.</div></Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((m) => (
              <Card
                key={m.id}
                className="p-4 cursor-pointer hover:shadow-md transition-all"
                onClick={() => setSelectedMember(m)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-barlow font-bold text-base">{m.firstName} {m.lastName}</h3>
                    <p className="text-xs text-muted-foreground">{m.network}</p>
                  </div>
                  <Badge variant={m.status === "active" ? "default" : "secondary"} className="text-xs">{m.status}</Badge>
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground mt-3">
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /><span className="truncate">{m.email}</span></div>
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /><span>{m.zipCode}</span></div>
                  <div className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" /><span>Joined {new Date(m.joinDate).toLocaleDateString()}</span></div>
                </div>
                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Engagement</span>
                  <span className="font-bold">{m.engagementScore}</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px]">Network</TableHead>
                  <TableHead className="text-[11px]">Name</TableHead>
                  <TableHead className="text-[11px]">Email</TableHead>
                  <TableHead className="text-[11px] text-center">Score</TableHead>
                  <TableHead className="text-[11px]">Joined</TableHead>
                  <TableHead className="text-[11px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((m) => (
                  <TableRow key={m.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedMember(m)}>
                    <TableCell className="text-xs py-2">{m.network}</TableCell>
                    <TableCell className="py-2">
                      <div className="font-medium text-xs">{m.firstName} {m.lastName}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground py-2">{m.email}</TableCell>
                    <TableCell className="text-center font-medium text-xs py-2">{m.engagementScore}</TableCell>
                    <TableCell className="text-xs text-muted-foreground py-2">{new Date(m.joinDate).toLocaleDateString()}</TableCell>
                    <TableCell className="py-2"><Badge variant={m.status === "active" ? "default" : "secondary"} className="text-[10px]">{m.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {selectedMember && (
          <EventDetailDialog
            open={!!selectedMember}
            onOpenChange={() => setSelectedMember(null)}
            title={`${selectedMember.firstName} ${selectedMember.lastName}`}
            description={selectedMember.network}
            rows={getDetailRows(selectedMember)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminMembersPage;
