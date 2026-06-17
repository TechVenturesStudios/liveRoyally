import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Filter, UserPlus, Users, Phone, Mail, MapPin, BarChart3, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

export interface ManagedProvider {
  id: string;
  displayId?: string | null;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  category: string;
  joinDate: string;
  rating: number;
  engagementScore: number;
  lastActivity: string;
}

interface AccountManagementTabProps {
  providers: ManagedProvider[];
  loading?: boolean;
}

const AccountManagementTab = ({ providers, loading = false }: AccountManagementTabProps) => {
  const [providerAccounts, setProviderAccounts] = useState<ManagedProvider[]>(providers);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddProviderDialog, setShowAddProviderDialog] = useState(false);
  const [showProviderDetails, setShowProviderDetails] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ManagedProvider | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedProvider | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [newProvider, setNewProvider] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    category: "",
  });

  useEffect(() => {
    setProviderAccounts(providers);
  }, [providers]);

  const filteredProviders = useMemo(() => {
    return providerAccounts.filter((provider) => {
      const matchesSearch =
        provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || provider.status === filterStatus;
      const matchesCategory = filterCategory === "all" || provider.category === filterCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [providerAccounts, searchQuery, filterStatus, filterCategory]);

  const categories = Array.from(new Set(providerAccounts.map((provider) => provider.category)));

  const voucherEngagementData = [
    {
      category: categories[0] || "Other",
      providers: providerAccounts.length,
      vouchersRedeemed: providerAccounts.length * 108,
      totalVouchers: Math.max(providerAccounts.length * 150, 1),
      avgScore:
        providerAccounts.length > 0
          ? Math.round(providerAccounts.reduce((sum, provider) => sum + provider.engagementScore, 0) / providerAccounts.length)
          : 0,
    },
  ];

  const networkDemographics = {
    totalProviders: providerAccounts.length,
    activeProviders: providerAccounts.filter((provider) => provider.status === "active").length,
    totalVouchersRedeemed: providerAccounts.length * 108,
    avgEngagement:
      providerAccounts.length > 0
        ? Math.round(providerAccounts.reduce((sum, provider) => sum + provider.engagementScore, 0) / providerAccounts.length)
        : 0,
    topCategory: categories[0] || "Other",
    cityCount: new Set(
      providerAccounts.map((provider) => provider.address.split(",").slice(-2, -1)[0]?.trim() || "Unknown")
    ).size,
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewProvider((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewProvider((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProvider = () => {
    if (!newProvider.name.trim() || !newProvider.email.trim()) {
      toast.error("Business name and email are required.");
      return;
    }

    const id = `PRV${String(Date.now()).slice(-6)}`;
    const today = new Date().toISOString().slice(0, 10);

    setProviderAccounts((prev) => [
      ...prev,
      {
        id,
        name: newProvider.name.trim(),
        contactName: newProvider.contactName.trim(),
        email: newProvider.email.trim(),
        phone: newProvider.phone.trim(),
        address: newProvider.address.trim(),
        status: "active",
        category: newProvider.category || "Other",
        joinDate: today,
        rating: 4,
        engagementScore: 0,
        lastActivity: today,
      },
    ]);

    toast.success(`${newProvider.name} has been added.`);
    setShowAddProviderDialog(false);
    setNewProvider({
      name: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      category: "",
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setProviderAccounts((prev) => prev.filter((provider) => provider.id !== deleteTarget.id));
    toast.success(`${deleteTarget.name} has been removed.`);
    setDeleteTarget(null);
  };

  const handleDownloadCSV = () => {
    const headers = ["ID", "Business Name", "Category", "Contact", "Email", "Phone", "Address", "Status", "Join Date", "Engagement Score"];
    const rows = providerAccounts.map((provider) => [
      provider.id,
      provider.name,
      provider.category,
      provider.contactName,
      provider.email,
      provider.phone,
      provider.address,
      provider.status,
      provider.joinDate,
      provider.engagementScore,
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.map((value) => `"${value}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "partner-network-providers.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Provider data exported as CSV.");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">Loading providers...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h2 className="text-xl font-barlow font-bold">Network Providers</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={handleDownloadCSV}>
            <Download className="h-3.5 w-3.5" />
            Download Data
          </Button>
          <Dialog open={showAddProviderDialog} onOpenChange={setShowAddProviderDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-7 text-xs gap-1.5">
                <UserPlus className="h-3.5 w-3.5" />
                Send Invite
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add New Provider</DialogTitle>
                <DialogDescription>
                  Add a new provider to your network. They will receive an invitation to join.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Business Name</Label>
                  <Input id="name" name="name" value={newProvider.name} onChange={handleInputChange} placeholder="Enter business name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Business Category</Label>
                  <Select onValueChange={(value) => handleSelectChange("category", value)} value={newProvider.category}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Entertainment">Entertainment</SelectItem>
                      <SelectItem value="Professional Services">Professional Services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactName">Contact Person</Label>
                  <Input id="contactName" name="contactName" value={newProvider.contactName} onChange={handleInputChange} placeholder="Enter primary contact name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={newProvider.email} onChange={handleInputChange} placeholder="Enter email address" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" value={newProvider.phone} onChange={handleInputChange} placeholder="Enter phone number" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Input id="address" name="address" value={newProvider.address} onChange={handleInputChange} placeholder="Enter business address" />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddProviderDialog(false)}>Cancel</Button>
                <Button onClick={handleAddProvider}>Add Provider</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search providers..."
            className="pl-7 h-8 text-xs w-[180px] md:w-[240px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select onValueChange={setFilterStatus} value={filterStatus}>
          <SelectTrigger className="w-[110px] h-8 text-xs">
            <div className="flex items-center gap-1">
              <Filter className="h-3 w-3" />
              <span>Status</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={setFilterCategory} value={filterCategory}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <div className="flex items-center gap-1">
              <Filter className="h-3 w-3" />
              <span>Category</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Business</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs">Contact</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Engagement</TableHead>
                <TableHead className="text-xs w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProviders.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="py-2">
                    <div className="font-medium text-xs">{provider.name}</div>
                    <div className="text-[11px] text-muted-foreground">{provider.displayId || provider.id}</div>
                  </TableCell>
                  <TableCell className="text-xs py-2">{provider.category}</TableCell>
                  <TableCell className="py-2">
                    <div className="text-xs">{provider.contactName}</div>
                    <div className="text-[11px] text-muted-foreground">{provider.email}</div>
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge className={`text-[10px] px-1.5 py-0 ${provider.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {provider.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-1.5">
                      <Progress value={provider.engagementScore} className="h-1.5 w-14" />
                      <span className="text-xs">{provider.engagementScore}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" className="h-6 px-2 text-[11px]" onClick={() => { setSelectedProvider(provider); setShowProviderDetails(true); }}>
                        View
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(provider)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm">Network Demographics</CardTitle>
            <CardDescription className="text-xs">Overview of your network</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-2.5 text-center">
                <p className="text-lg font-bold text-foreground">{networkDemographics.totalProviders}</p>
                <p className="text-[11px] text-muted-foreground">Total Providers</p>
              </div>
              <div className="rounded-lg border p-2.5 text-center">
                <p className="text-lg font-bold text-foreground">{networkDemographics.activeProviders}</p>
                <p className="text-[11px] text-muted-foreground">Active</p>
              </div>
              <div className="rounded-lg border p-2.5 text-center">
                <p className="text-lg font-bold text-foreground">{networkDemographics.totalVouchersRedeemed}</p>
                <p className="text-[11px] text-muted-foreground">Vouchers Redeemed</p>
              </div>
              <div className="rounded-lg border p-2.5 text-center">
                <p className="text-lg font-bold text-foreground">{networkDemographics.avgEngagement}%</p>
                <p className="text-[11px] text-muted-foreground">Avg Engagement</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Top category: <span className="font-medium text-foreground">{networkDemographics.topCategory}</span>
              <br />
              Cities represented: <span className="font-medium text-foreground">{networkDemographics.cityCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm">Provider Engagement by Voucher Usage</CardTitle>
            <CardDescription className="text-xs">Voucher redemption performance by category</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-4">
              {voucherEngagementData.map((item) => {
                const redemptionRate = Math.round((item.vouchersRedeemed / item.totalVouchers) * 100);
                return (
                  <div key={item.category} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">{item.category}</h4>
                      <Badge variant="outline" className="text-[10px]">{item.providers} providers</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Vouchers Redeemed</span>
                        <span className="font-semibold">{item.vouchersRedeemed} / {item.totalVouchers}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Redemption Rate</span>
                        <span className="font-semibold">{redemptionRate}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Avg Engagement</span>
                        <span className="font-semibold">{item.avgScore}%</span>
                      </div>
                    </div>
                    <Progress value={redemptionRate} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedProvider && (
        <Dialog open={showProviderDetails} onOpenChange={setShowProviderDetails}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedProvider.name}</DialogTitle>
              <DialogDescription>Provider account details and management</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> Contact: {selectedProvider.contactName}</div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {selectedProvider.email}</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {selectedProvider.phone}</div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {selectedProvider.address}</div>
              <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-muted-foreground" /> Engagement: {selectedProvider.engagementScore}%</div>
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> ID: {selectedProvider.displayId || selectedProvider.id}</div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowProviderDetails(false)}>Close</Button>
              <Button>Message Provider</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Provider</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{deleteTarget?.name}</strong> from your network?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountManagementTab;
