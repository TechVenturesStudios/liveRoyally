import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import ViewToggle from "@/components/ui/ViewToggle";
import EventDetailDialog from "@/components/ui/EventDetailDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import FormField from "@/components/ui/FormField";
import { Users, Building, Plus, Trash2, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

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
}

// Mock: providers belonging to the currently logged-in partner
const initialProviders: ProviderEntry[] = [
  { id: "PRV001", businessName: "Smith's Merchandise", businessCategory: "Retail", agentFirstName: "John", agentLastName: "Smith", agentPhone: "555-123-4567", businessEmail: "info@smithmerch.com", businessPhone: "555-987-6543", businessAddress: "123 Commerce St", businessCity: "Metropolis", businessState: "NY", businessZip: "10001" },
  { id: "PRV003", businessName: "Williams Fitness", businessCategory: "Health & Wellness", agentFirstName: "Michael", agentLastName: "Williams", agentPhone: "555-345-6789", businessEmail: "info@williamsfitness.com", businessPhone: "555-765-4321", businessAddress: "789 Gym Ave", businessCity: "Fitsville", businessState: "CA", businessZip: "90210" },
  { id: "PRV008", businessName: "Turner Hardware", businessCategory: "Home & Garden", agentFirstName: "Alex", agentLastName: "Turner", agentPhone: "555-890-1234", businessEmail: "info@turnerhw.com", businessPhone: "555-210-9876", businessAddress: "99 Fix-It Rd", businessCity: "Metropolis", businessState: "NY", businessZip: "10003" },
];

const BUSINESS_CATEGORIES = [
  { label: "Retail", value: "Retail" },
  { label: "Food & Beverage", value: "Food & Beverage" },
  { label: "Entertainment", value: "Entertainment" },
  { label: "Health & Wellness", value: "Health & Wellness" },
  { label: "Professional Services", value: "Professional Services" },
  { label: "Home & Garden", value: "Home & Garden" },
  { label: "Other", value: "Other" },
];

const PartnerProvidersPage = () => {
  const navigate = useNavigate();
  const { isLoading } = useAuthCheck();
  const [providers, setProviders] = useState<ProviderEntry[]>(initialProviders);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<ProviderEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProviderEntry | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProvider, setNewProvider] = useState({
    businessName: "",
    businessCategory: "",
    agentFirstName: "",
    agentLastName: "",
    agentPhone: "",
    businessEmail: "",
    businessPhone: "",
    businessAddress: "",
    businessCity: "",
    businessState: "",
    businessZip: "",
  });

  const filteredProviders = useMemo(() => {
    if (!searchQuery.trim()) return providers;
    const q = searchQuery.toLowerCase();
    return providers.filter(
      (p) =>
        p.businessName.toLowerCase().includes(q) ||
        p.agentFirstName.toLowerCase().includes(q) ||
        p.agentLastName.toLowerCase().includes(q) ||
        p.businessCategory.toLowerCase().includes(q) ||
        p.businessCity.toLowerCase().includes(q)
    );
  }, [providers, searchQuery]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    setProviders((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    toast.success(`${deleteTarget.businessName} has been removed.`);
    setDeleteTarget(null);
  };

  const handleAdd = () => {
    if (!newProvider.businessName.trim() || !newProvider.businessEmail.trim()) {
      toast.error("Business name and email are required.");
      return;
    }
    const id = `PRV${String(Date.now()).slice(-5)}`;
    setProviders((prev) => [
      ...prev,
      { id, ...newProvider } as ProviderEntry,
    ]);
    toast.success(`${newProvider.businessName} has been added.`);
    setShowAddDialog(false);
    setNewProvider({
      businessName: "", businessCategory: "", agentFirstName: "", agentLastName: "",
      agentPhone: "", businessEmail: "", businessPhone: "", businessAddress: "",
      businessCity: "", businessState: "", businessZip: "",
    });
  };

  const handleNewProviderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewProvider((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewProviderSelect = (name: string) => (value: string) => {
    setNewProvider((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoading) return <LoadingSpinner />;

  const getDetailRows = (p: ProviderEntry) => [
    { label: "Business Name", value: p.businessName },
    { label: "Category", value: p.businessCategory },
    { label: "Contact", value: `${p.agentFirstName} ${p.agentLastName}` },
    { label: "Contact Phone", value: p.agentPhone },
    { label: "Business Email", value: p.businessEmail },
    { label: "Business Phone", value: p.businessPhone },
    { label: "Address", value: `${p.businessAddress}, ${p.businessCity}, ${p.businessState} ${p.businessZip}` },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-barlow font-bold text-2xl sm:text-3xl text-foreground mb-1">My Providers</h1>
            <p className="text-sm text-muted-foreground">
              Manage the providers in your network.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{providers.length} providers</span>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm" className="bg-royal hover:bg-royal-dark text-white gap-1.5">
              <Plus className="h-4 w-4" />
              Add Provider
            </Button>
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search providers..."
            className="pl-9 h-10"
          />
        </div>

        {filteredProviders.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <UserPlus className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {searchQuery ? "No providers found" : "No providers yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? "Try a different search term." : "Add your first provider to get started."}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowAddDialog(true)} className="bg-royal hover:bg-royal-dark text-white gap-1.5">
                <Plus className="h-4 w-4" />
                Add Provider
              </Button>
            )}
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProviders.map((p) => (
              <Card key={p.id} className="flex flex-col hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setSelectedProvider(p)}>
                      <CardTitle className="text-base font-semibold truncate">{p.businessName}</CardTitle>
                      <CardDescription className="mt-1">{p.businessCategory}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3 text-sm cursor-pointer" onClick={() => setSelectedProvider(p)}>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Contact</span>
                      <span className="text-foreground text-xs">{p.agentFirstName} {p.agentLastName}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Location</span>
                      <span className="text-foreground text-xs">{p.businessCity}, {p.businessState}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Email</span>
                      <span className="text-foreground text-xs truncate block">{p.businessEmail}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Phone</span>
                      <span className="text-foreground text-xs">{p.businessPhone}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[11px]">Business</TableHead>
                    <TableHead className="text-[11px]">Category</TableHead>
                    <TableHead className="text-[11px]">Contact</TableHead>
                    <TableHead className="text-[11px]">Location</TableHead>
                    <TableHead className="text-[11px]">Phone</TableHead>
                    <TableHead className="text-[11px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProviders.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="py-2" onClick={() => setSelectedProvider(p)}>
                        <div className="font-medium text-xs">{p.businessName}</div>
                        <div className="text-[11px] text-muted-foreground">{p.businessEmail}</div>
                      </TableCell>
                      <TableCell className="text-xs py-2" onClick={() => setSelectedProvider(p)}>
                        <Badge variant="outline" className="text-[10px]">{p.businessCategory}</Badge>
                      </TableCell>
                      <TableCell className="text-xs py-2" onClick={() => setSelectedProvider(p)}>
                        {p.agentFirstName} {p.agentLastName}
                      </TableCell>
                      <TableCell className="text-xs py-2" onClick={() => setSelectedProvider(p)}>
                        {p.businessCity}, {p.businessState}
                      </TableCell>
                      <TableCell className="text-xs py-2" onClick={() => setSelectedProvider(p)}>
                        {p.businessPhone}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>

      {/* View Detail Dialog */}
      {selectedProvider && (
        <EventDetailDialog
          open={!!selectedProvider}
          onOpenChange={() => setSelectedProvider(null)}
          title={selectedProvider.businessName}
          description={selectedProvider.businessCategory}
          rows={getDetailRows(selectedProvider)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Provider</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteTarget?.businessName}</strong> from your network? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Provider Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Invite</DialogTitle>
            <DialogDescription>Send an invite to a new provider to join your network.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <FormField label="Business Name" name="businessName" type="text" placeholder="Enter business name" required value={newProvider.businessName} onChange={handleNewProviderInput} />
            <FormField label="Category" name="businessCategory" type="select" required options={BUSINESS_CATEGORIES} value={newProvider.businessCategory} onSelectChange={handleNewProviderSelect("businessCategory")} />
            <FormField label="Contact First Name" name="agentFirstName" type="text" placeholder="First name" value={newProvider.agentFirstName} onChange={handleNewProviderInput} />
            <FormField label="Contact Last Name" name="agentLastName" type="text" placeholder="Last name" value={newProvider.agentLastName} onChange={handleNewProviderInput} />
            <FormField label="Contact Phone" name="agentPhone" type="tel" placeholder="Phone number" value={newProvider.agentPhone} onChange={handleNewProviderInput} />
            <FormField label="Business Email" name="businessEmail" type="email" placeholder="Email address" required value={newProvider.businessEmail} onChange={handleNewProviderInput} />
            <FormField label="Business Phone" name="businessPhone" type="tel" placeholder="Business phone" value={newProvider.businessPhone} onChange={handleNewProviderInput} />
            <FormField label="Address" name="businessAddress" type="text" placeholder="Street address" value={newProvider.businessAddress} onChange={handleNewProviderInput} />
            <FormField label="City" name="businessCity" type="text" placeholder="City" value={newProvider.businessCity} onChange={handleNewProviderInput} />
            <FormField label="State" name="businessState" type="text" placeholder="State" value={newProvider.businessState} onChange={handleNewProviderInput} />
            <FormField label="Zip Code" name="businessZip" type="text" placeholder="Zip code" value={newProvider.businessZip} onChange={handleNewProviderInput} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} className="bg-royal hover:bg-royal-dark text-white">Send Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default PartnerProvidersPage;
