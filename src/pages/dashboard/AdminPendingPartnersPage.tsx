
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ViewToggle from "@/components/ui/ViewToggle";
import EventDetailDialog from "@/components/ui/EventDetailDialog";
import { Building, Clock, MapPin, Mail, CheckCircle, XCircle, Users, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const mockPendingPartners = [
  {
    id: "PTR-P001",
    organizationName: "Downtown Business Alliance",
    organizationCategory: "Business Association",
    agentFirstName: "Maria",
    agentLastName: "Garcia",
    agentPhone: "555-321-7654",
    organizationEmail: "info@downtownba.org",
    organizationPhone: "555-321-0000",
    organizationAddress: "100 Main St",
    organizationCity: "Springfield",
    organizationState: "IL",
    organizationZip: "62701",
    submittedDate: "2026-02-18",
    networkCode: "ROYAL1",
  },
  {
    id: "PTR-P002",
    organizationName: "Westside Community Foundation",
    organizationCategory: "Nonprofit",
    agentFirstName: "James",
    agentLastName: "Lee",
    agentPhone: "555-456-1234",
    organizationEmail: "contact@westsidecf.org",
    organizationPhone: "555-456-0000",
    organizationAddress: "250 West Blvd",
    organizationCity: "Metropolis",
    organizationState: "NY",
    organizationZip: "10002",
    submittedDate: "2026-02-20",
    networkCode: "ROYAL1",
  },
  {
    id: "PTR-P003",
    organizationName: "Heritage Arts Council",
    organizationCategory: "Arts & Culture",
    agentFirstName: "Linda",
    agentLastName: "Nguyen",
    agentPhone: "555-789-4561",
    organizationEmail: "hello@heritagearts.org",
    organizationPhone: "555-789-0000",
    organizationAddress: "75 Gallery Row",
    organizationCity: "Fitsville",
    organizationState: "CA",
    organizationZip: "90211",
    submittedDate: "2026-02-22",
    networkCode: "ROYAL1",
  },
];

const AdminPendingPartnersPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || "/dashboard/admin/profile";
  const backLabel = from.includes("analytics") ? "Back to Analytics" : "Back to Home";
  const { user, isLoading } = useAuthCheck();
  const [partners, setPartners] = useState(mockPendingPartners);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedPartner, setSelectedPartner] = useState<typeof mockPendingPartners[0] | null>(null);

  if (isLoading) return <LoadingSpinner />;

  const handleApprove = (id: string, name: string) => {
    setPartners((prev) => prev.filter((p) => p.id !== id));
    setSelectedPartner(null);
    toast.success(`${name} has been approved`);
  };

  const handleDecline = (id: string, name: string) => {
    setPartners((prev) => prev.filter((p) => p.id !== id));
    setSelectedPartner(null);
    toast.error(`${name} has been declined`);
  };

  const getDetailRows = (p: typeof mockPendingPartners[0]) => [
    { label: "Organization", value: p.organizationName },
    { label: "Category", value: p.organizationCategory },
    { label: "Contact", value: `${p.agentFirstName} ${p.agentLastName}` },
    { label: "Phone", value: p.agentPhone },
    { label: "Email", value: p.organizationEmail },
    { label: "Office Phone", value: p.organizationPhone },
    { label: "Address", value: `${p.organizationAddress}, ${p.organizationCity}, ${p.organizationState} ${p.organizationZip}` },
    { label: "Network", value: p.networkCode },
    { label: "Submitted", value: new Date(p.submittedDate).toLocaleDateString() },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2 h-7 text-xs"
          onClick={() => navigate(from)}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-barlow font-bold text-2xl sm:text-3xl text-foreground mb-1">Pending Partners</h1>
            <p className="text-sm text-muted-foreground">Review and approve partner applications</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">{partners.length} pending</span>
            </div>
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>
        </div>

        {partners.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {partners.map((p) => (
                <Card key={p.id} className="flex flex-col cursor-pointer hover:shadow-md transition-all" onClick={() => setSelectedPartner(p)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base font-semibold truncate">{p.organizationName}</CardTitle>
                        <CardDescription className="mt-1">{p.organizationCategory}</CardDescription>
                      </div>
                      <div className="rounded-full p-2 bg-muted shrink-0">
                        <Building className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Contact</span>
                        <span className="text-foreground text-xs">{p.agentFirstName} {p.agentLastName}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Location</span>
                        <span className="text-foreground text-xs">{p.organizationCity}, {p.organizationState}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Email</span>
                        <span className="text-foreground text-xs truncate block">{p.organizationEmail}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Network</span>
                        <span className="text-foreground text-xs">{p.networkCode}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t">
                      <span className="text-xs font-medium text-foreground/60 uppercase tracking-wide">Submitted</span>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0">
                        {new Date(p.submittedDate).toLocaleDateString()}
                      </Badge>
                    </div>
                  </CardContent>
                  <div className="p-4 pt-0 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(p.id, p.organizationName)}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleDecline(p.id, p.organizationName)}>
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
                        <TableHead className="text-[11px]">Organization</TableHead>
                        <TableHead className="text-[11px]">Category</TableHead>
                        <TableHead className="text-[11px]">Contact</TableHead>
                        <TableHead className="text-[11px]">Location</TableHead>
                        <TableHead className="text-[11px]">Submitted</TableHead>
                        <TableHead className="text-[11px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners.map((p) => (
                        <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPartner(p)}>
                          <TableCell className="py-2">
                            <div className="font-medium text-xs">{p.organizationName}</div>
                            <div className="text-[11px] text-muted-foreground">{p.organizationEmail}</div>
                          </TableCell>
                          <TableCell className="text-xs py-2">{p.organizationCategory}</TableCell>
                          <TableCell className="text-xs py-2">{p.agentFirstName} {p.agentLastName}</TableCell>
                          <TableCell className="text-xs py-2">{p.organizationCity}, {p.organizationState}</TableCell>
                          <TableCell className="py-2">
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0">
                              {new Date(p.submittedDate).toLocaleDateString()}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button size="sm" className="h-6 px-2 text-[10px] bg-green-600 hover:bg-green-700" onClick={() => handleApprove(p.id, p.organizationName)}>
                                <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Approve
                              </Button>
                              <Button size="sm" variant="destructive" className="h-6 px-2 text-[10px]" onClick={() => handleDecline(p.id, p.organizationName)}>
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
              No pending partner applications
            </CardContent>
          </Card>
        )}
      </div>

      {selectedPartner && (
        <EventDetailDialog
          open={!!selectedPartner}
          onOpenChange={() => setSelectedPartner(null)}
          title={selectedPartner.organizationName}
          description={selectedPartner.organizationCategory}
          rows={getDetailRows(selectedPartner)}
          actions={
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(selectedPartner.id, selectedPartner.organizationName)}>
                <CheckCircle className="h-4 w-4 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleDecline(selectedPartner.id, selectedPartner.organizationName)}>
                <XCircle className="h-4 w-4 mr-1" /> Decline
              </Button>
            </div>
          }
        />
      )}
    </DashboardLayout>
  );
};

export default AdminPendingPartnersPage;
