import React, { useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ViewToggle from "@/components/ui/ViewToggle";
import EventDetailDialog from "@/components/ui/EventDetailDialog";
import { ArrowLeft, Users, Building, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ProviderEntry {
  id: string;
  businessName: string;
  businessCategory: string;
  agentFirstName: string;
  agentLastName: string;
  agentPhone: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZip: string;
  partnerName: string;
  networkCode: string;
}

interface PartnerInfo {
  name: string;
  category: string;
  contactName: string;
  contactPhone: string;
  email: string;
  phone: string;
  city: string;
  state: string;
}

const networkInfo: Record<string, string> = {
  ROYAL1: "Network Alpha",
  METRO1: "Network Beta",
  WEST1: "Network Gamma",
};

const partnerDetails: Record<string, PartnerInfo> = {
  "City Community Foundation": { name: "City Community Foundation", category: "Nonprofit", contactName: "Robert Davis", contactPhone: "555-100-2000", email: "info@citycf.org", phone: "555-100-2001", city: "Metropolis", state: "NY" },
  "Downtown Business Alliance": { name: "Downtown Business Alliance", category: "Business Association", contactName: "Sarah Mitchell", contactPhone: "555-200-3000", email: "info@downtownba.org", phone: "555-200-3001", city: "Springfield", state: "IL" },
  "Heritage Arts Council": { name: "Heritage Arts Council", category: "Arts & Culture", contactName: "Diana Torres", contactPhone: "555-300-4000", email: "info@heritagearts.org", phone: "555-300-4001", city: "Metropolis", state: "NY" },
  "Westside Community Foundation": { name: "Westside Community Foundation", category: "Nonprofit", contactName: "Kevin Park", contactPhone: "555-400-5000", email: "info@westsidecf.org", phone: "555-400-5001", city: "Lakewood", state: "OH" },
  "Riverfront Chamber of Commerce": { name: "Riverfront Chamber of Commerce", category: "Chamber of Commerce", contactName: "Lisa Chang", contactPhone: "555-500-6000", email: "info@riverfrontcc.org", phone: "555-500-6001", city: "Portland", state: "OR" },
};

const allProviders: ProviderEntry[] = [
  { id: "PRV001", businessName: "Smith's Merchandise", businessCategory: "Retail", agentFirstName: "John", agentLastName: "Smith", agentPhone: "555-123-4567", businessEmail: "info@smithmerch.com", businessPhone: "555-987-6543", businessAddress: "123 Commerce St", businessCity: "Metropolis", businessState: "NY", businessZip: "10001", partnerName: "City Community Foundation", networkCode: "ROYAL1" },
  { id: "PRV002", businessName: "Johnson Cafe", businessCategory: "Food & Beverage", agentFirstName: "Emma", agentLastName: "Johnson", agentPhone: "555-234-5678", businessEmail: "info@johnsoncafe.com", businessPhone: "555-876-5432", businessAddress: "456 Main St", businessCity: "Springfield", businessState: "IL", businessZip: "62701", partnerName: "Downtown Business Alliance", networkCode: "ROYAL1" },
  { id: "PRV003", businessName: "Williams Fitness", businessCategory: "Health & Wellness", agentFirstName: "Michael", agentLastName: "Williams", agentPhone: "555-345-6789", businessEmail: "info@williamsfitness.com", businessPhone: "555-765-4321", businessAddress: "789 Gym Ave", businessCity: "Fitsville", businessState: "CA", businessZip: "90210", partnerName: "City Community Foundation", networkCode: "ROYAL1" },
  { id: "PRV004", businessName: "Garcia Auto", businessCategory: "Automotive", agentFirstName: "Maria", agentLastName: "Garcia", agentPhone: "555-456-7890", businessEmail: "info@garciaauto.com", businessPhone: "555-654-3210", businessAddress: "321 Motor Ln", businessCity: "Springfield", businessState: "IL", businessZip: "62702", partnerName: "Downtown Business Alliance", networkCode: "METRO1" },
  { id: "PRV005", businessName: "Lee's Electronics", businessCategory: "Retail", agentFirstName: "James", agentLastName: "Lee", agentPhone: "555-567-8901", businessEmail: "info@leeselectronics.com", businessPhone: "555-543-2109", businessAddress: "555 Tech Blvd", businessCity: "Metropolis", businessState: "NY", businessZip: "10002", partnerName: "Heritage Arts Council", networkCode: "ROYAL1" },
  { id: "PRV006", businessName: "Nguyen Bakery", businessCategory: "Food & Beverage", agentFirstName: "Linda", agentLastName: "Nguyen", agentPhone: "555-678-9012", businessEmail: "info@nguyenbakery.com", businessPhone: "555-432-1098", businessAddress: "88 Baker St", businessCity: "Lakewood", businessState: "OH", businessZip: "44107", partnerName: "Westside Community Foundation", networkCode: "WEST1" },
  { id: "PRV007", businessName: "Chen Design Studio", businessCategory: "Creative Services", agentFirstName: "Michael", agentLastName: "Chen", agentPhone: "555-789-0123", businessEmail: "hello@chendesign.com", businessPhone: "555-321-0987", businessAddress: "42 Art Way", businessCity: "Portland", businessState: "OR", businessZip: "97201", partnerName: "Riverfront Chamber of Commerce", networkCode: "WEST1" },
  { id: "PRV008", businessName: "Turner Hardware", businessCategory: "Home & Garden", agentFirstName: "Alex", agentLastName: "Turner", agentPhone: "555-890-1234", businessEmail: "info@turnerhw.com", businessPhone: "555-210-9876", businessAddress: "99 Fix-It Rd", businessCity: "Metropolis", businessState: "NY", businessZip: "10003", partnerName: "City Community Foundation", networkCode: "ROYAL1" },
];

const AdminNetworkDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || "/dashboard/admin/profile";
  const backLabel = from.includes("analytics") ? "Back to Analytics" : "Back to Home";
  const { networkCode } = useParams<{ networkCode: string }>();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedProvider, setSelectedProvider] = useState<ProviderEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const networkName = networkCode ? networkInfo[networkCode] || networkCode : "Unknown Network";

  const filteredProviders = useMemo(
    () => allProviders.filter((p) => p.networkCode === networkCode),
    [networkCode]
  );

  const groupedByPartner = useMemo(() => {
    const groups: Record<string, ProviderEntry[]> = {};
    filteredProviders.forEach((p) => {
      if (!groups[p.partnerName]) groups[p.partnerName] = [];
      groups[p.partnerName].push(p);
    });
    return groups;
  }, [filteredProviders]);

  const sortedPartnerNames = Object.keys(groupedByPartner).sort();

  const filteredPartnerNames = useMemo(
    () => sortedPartnerNames.filter((name) =>
      name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [sortedPartnerNames, searchQuery]
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

        {filteredProviders.length > 0 ? (
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
              {filteredPartnerNames.length > 0 ? filteredPartnerNames.map((partnerName) => (
                <Collapsible key={partnerName}>
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <h2 className="font-barlow font-bold text-sm uppercase tracking-wide text-muted-foreground">{partnerName}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">{groupedByPartner[partnerName].length}</Badge>
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
                              {groupedByPartner[partnerName].map((p) => (
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
              {sortedPartnerNames.map((partnerName) => {
                const partner = partnerDetails[partnerName];
                return (
                  <Card key={partnerName} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base font-semibold truncate">{partnerName}</CardTitle>
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
                          Providers ({groupedByPartner[partnerName].length})
                        </span>
                        <div className="space-y-1">
                          {groupedByPartner[partnerName].map((p) => (
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
