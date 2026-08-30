import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ViewToggle from "@/components/ui/ViewToggle";
import EventDetailDialog from "@/components/ui/EventDetailDialog";
import { ArrowLeft, Users, Building, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { fetchAdminNetwork, type AdminNetworkProvider, type AdminNetworkPartner } from "@/api/adminNetwork";
import { getUserFromStorage } from "@/utils/userStorage";

type ProviderEntry = AdminNetworkProvider;

const AdminNetworkDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || "/dashboard/admin/profile";
  const backLabel = from.includes("analytics") ? "Back to Analytics" : "Back to Home";
  const { networkCode } = useParams<{ networkCode: string }>();
  const { user, isLoading } = useAuthCheck();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedProvider, setSelectedProvider] = useState<ProviderEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [networkName, setNetworkName] = useState(networkCode || "Unknown Network");
  const [partners, setPartners] = useState<AdminNetworkPartner[]>([]);
  const [providers, setProviders] = useState<ProviderEntry[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || !user || !networkCode) return;

    let cancelled = false;
    setDirectoryLoading(true);
    fetchAdminNetwork(networkCode, getUserFromStorage()?.cognitoId)
      .then((data) => {
        if (cancelled) return;
        setNetworkName(data.name);
        setPartners(data.partners);
        setProviders(data.providers);
      })
      .catch((error) => {
        if (!cancelled) setDirectoryError(error instanceof Error ? error.message : "Failed to load network");
      })
      .finally(() => {
        if (!cancelled) setDirectoryLoading(false);
      });

    return () => { cancelled = true; };
  }, [isLoading, networkCode, user]);

  const filteredProviders = providers;

  const groupedByPartner = useMemo(() => {
    const groups: Record<string, ProviderEntry[]> = {};
    partners.forEach((partner) => { groups[partner.id] = []; });
    filteredProviders.forEach((p) => {
      const partnerKey = p.partnerId || `unassigned:${p.partnerName}`;
      if (!groups[partnerKey]) groups[partnerKey] = [];
      groups[partnerKey].push(p);
    });
    return groups;
  }, [filteredProviders, partners]);

  const partnerDetails = useMemo(
    () => Object.fromEntries(partners.map((partner) => [partner.id, partner])),
    [partners]
  );
  const getPartnerName = (partnerKey: string) =>
    partnerDetails[partnerKey]?.name || groupedByPartner[partnerKey]?.[0]?.partnerName || partnerKey;
  const sortedPartnerNames = Object.keys(groupedByPartner).sort((a, b) =>
    getPartnerName(a).localeCompare(getPartnerName(b))
  );

  const filteredPartnerNames = useMemo(
    () => sortedPartnerNames.filter((partnerKey) => {
      const partnerName = partnerDetails[partnerKey]?.name ||
        groupedByPartner[partnerKey]?.[0]?.partnerName || partnerKey;
      return partnerName.toLowerCase().includes(searchQuery.toLowerCase());
    }),
    [sortedPartnerNames, searchQuery, partnerDetails, groupedByPartner]
  );

  const getDetailRows = (p: ProviderEntry) => [
    { label: "Business Name", value: p.businessName },
    { label: "Category", value: p.businessCategory },
    { label: "Contact", value: `${p.agentFirstName} ${p.agentLastName}` },
    { label: "Contact Phone", value: p.agentPhone },
    { label: "Business Email", value: p.businessEmail },
    { label: "Business Phone", value: p.businessPhone },
    { label: "Address", value: `${p.businessAddress}, ${p.businessCity}, ${p.businessState} ${p.businessZip}` },
    { label: "Partner", value: p.partnerName },
  ];

  if (isLoading || directoryLoading) return <LoadingSpinner />;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2 h-7 text-xs"
          onClick={() => navigate(from)}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-barlow font-bold text-2xl sm:text-3xl text-foreground mb-1">{networkName}</h1>
            <p className="text-sm text-muted-foreground">
              {sortedPartnerNames.length} partner{sortedPartnerNames.length !== 1 ? "s" : ""} · {filteredProviders.length} provider{filteredProviders.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 border border-purple-100">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">{filteredProviders.length} providers</span>
            </div>
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>
        </div>

        {directoryError ? (
          <Card><CardContent className="py-10 text-center text-destructive text-sm">{directoryError}</CardContent></Card>
        ) : partners.length > 0 ? (
          viewMode === "list" ? (
            <div className="space-y-4">
              <div className="relative max-w-[220px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search partners..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-7 text-xs"
                />
              </div>
              {filteredPartnerNames.length > 0 ? filteredPartnerNames.map((partnerKey) => (
                <Collapsible key={partnerKey}>
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <h2 className="font-barlow font-bold text-sm uppercase tracking-wide text-muted-foreground">{getPartnerName(partnerKey)}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">{groupedByPartner[partnerKey].length}</Badge>
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="p-0 border-t">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-[11px]">Business</TableHead>
                                <TableHead className="text-[11px]">Category</TableHead>
                                <TableHead className="text-[11px]">Contact</TableHead>
                                <TableHead className="text-[11px]">Location</TableHead>
                                <TableHead className="text-[11px]">Phone</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                            {groupedByPartner[partnerKey].map((p) => (
                                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedProvider(p)}>
                                  <TableCell className="py-2">
                                    <div className="font-medium text-xs">{p.businessName}</div>
                                    <div className="text-[11px] text-muted-foreground">{p.businessEmail}</div>
                                  </TableCell>
                                  <TableCell className="text-xs py-2">{p.businessCategory}</TableCell>
                                  <TableCell className="text-xs py-2">{p.agentFirstName} {p.agentLastName}</TableCell>
                                  <TableCell className="text-xs py-2">{p.businessCity}, {p.businessState}</TableCell>
                                  <TableCell className="text-xs py-2">{p.businessPhone}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground text-sm">
                    No partners match "{searchQuery}"
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedPartnerNames.map((partnerKey) => {
                const partner = partnerDetails[partnerKey];
                return (
                  <Card key={partnerKey} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base font-semibold truncate">{getPartnerName(partnerKey)}</CardTitle>
                          <CardDescription className="mt-1">{partner?.category || "Partner"}</CardDescription>
                        </div>
                        <div className="rounded-full p-2 bg-muted shrink-0">
                          <Building className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3 text-sm">
                      {partner && (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div>
                            <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Contact</span>
                            <span className="text-foreground text-xs">{partner.contactName}</span>
                          </div>
                          <div>
                            <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Location</span>
                            <span className="text-foreground text-xs">{partner.city}, {partner.state}</span>
                          </div>
                          <div>
                            <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Email</span>
                            <span className="text-foreground text-xs truncate block">{partner.email}</span>
                          </div>
                          <div>
                            <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Phone</span>
                            <span className="text-foreground text-xs">{partner.phone}</span>
                          </div>
                        </div>
                      )}
                      <div className="pt-2 border-t">
                        <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide mb-2">
                          Providers ({groupedByPartner[partnerKey].length})
                        </span>
                        <div className="space-y-1">
                          {groupedByPartner[partnerKey].map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/60 cursor-pointer transition-colors"
                              onClick={() => setSelectedProvider(p)}
                            >
                              <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-xs font-medium text-primary hover:underline">{p.businessName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No providers found in this network
            </CardContent>
          </Card>
        )}
      </div>

      {selectedProvider && (
        <EventDetailDialog
          open={!!selectedProvider}
          onOpenChange={() => setSelectedProvider(null)}
          title={selectedProvider.businessName}
          description={selectedProvider.businessCategory}
          rows={getDetailRows(selectedProvider)}
        />
      )}
    </DashboardLayout>
  );
};

export default AdminNetworkDetailPage;
