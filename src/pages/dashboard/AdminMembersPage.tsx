
import React, { useState } from "react";
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
import { Users, Globe, ArrowLeft, UserCheck, Mail, MapPin, CalendarDays } from "lucide-react";

interface MockMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  network: string;
  networkCode: string;
  zipCode: string;
  joinDate: string;
  status: "active" | "inactive";
  engagementScore: number;
}

const mockMembers: MockMember[] = [
  { id: "MEM001", firstName: "Alex", lastName: "Turner", email: "alex@example.com", network: "Royal Network", networkCode: "ROYAL1", zipCode: "10001", joinDate: "2024-01-15", status: "active", engagementScore: 720 },
  { id: "MEM002", firstName: "Jessica", lastName: "Williams", email: "jessica@example.com", network: "Royal Network", networkCode: "ROYAL1", zipCode: "10002", joinDate: "2024-02-03", status: "active", engagementScore: 650 },
  { id: "MEM003", firstName: "David", lastName: "Miller", email: "david@example.com", network: "Royal Network", networkCode: "ROYAL1", zipCode: "10003", joinDate: "2024-03-21", status: "inactive", engagementScore: 310 },
  { id: "MEM004", firstName: "Sarah", lastName: "Johnson", email: "sarah@example.com", network: "Metro Alliance", networkCode: "METRO1", zipCode: "62701", joinDate: "2024-04-10", status: "active", engagementScore: 890 },
  { id: "MEM005", firstName: "Michael", lastName: "Chen", email: "michael@example.com", network: "Metro Alliance", networkCode: "METRO1", zipCode: "62702", joinDate: "2024-05-18", status: "active", engagementScore: 540 },
  { id: "MEM006", firstName: "Linda", lastName: "Nguyen", email: "linda@example.com", network: "Westside Connect", networkCode: "WEST1", zipCode: "90211", joinDate: "2024-11-05", status: "active", engagementScore: 420 },
  { id: "MEM007", firstName: "James", lastName: "Lee", email: "james@example.com", network: "Westside Connect", networkCode: "WEST1", zipCode: "90212", joinDate: "2025-01-08", status: "inactive", engagementScore: 180 },
  { id: "MEM008", firstName: "Maria", lastName: "Garcia", email: "maria@example.com", network: "Royal Network", networkCode: "ROYAL1", zipCode: "10004", joinDate: "2024-06-22", status: "active", engagementScore: 770 },
];

const AdminMembersPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || "/dashboard/admin/analytics";
  const backLabel = from.includes("analytics") ? "Back to Analytics" : "Back to Home";
  const { isLoading } = useAuthCheck();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [statusFilter, setStatusFilter] = useState<"all" | "active">("all");
  const [selectedMember, setSelectedMember] = useState<MockMember | null>(null);

  if (isLoading) return <LoadingSpinner />;

  const activeCount = mockMembers.filter((m) => m.status === "active").length;
  const filteredMembers = statusFilter === "active"
    ? mockMembers.filter((m) => m.status === "active")
    : [...mockMembers].sort((a, b) => {
        if (a.status === "inactive" && b.status === "active") return -1;
        if (a.status === "active" && b.status === "inactive") return 1;
        return 0;
      });

  const getDetailRows = (m: MockMember) => [
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
              {mockMembers.length} total
            </button>
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>
        </div>

        {viewMode === "grid" ? (
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
