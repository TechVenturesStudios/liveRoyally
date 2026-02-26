
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Filter, UserPlus, Users, Phone, Mail, MapPin, BarChart3, Download } from "lucide-react";
import { toast } from "sonner";

// Sample provider accounts data
const providerAccounts = [
  {
    id: "PRV001",
    name: "City Fitness Center",
    contactName: "Michael Johnson",
    email: "michael@cityfitness.com",
    phone: "555-123-4567",
    address: "123 Main St, Metropolis",
    status: "active",
    category: "Health & Fitness",
    joinDate: "2025-01-15",
    rating: 5,
    engagementScore: 85,
    lastActivity: "2025-04-18"
  },
  {
    id: "PRV002",
    name: "Downtown Spa & Wellness",
    contactName: "Sarah Williams",
    email: "sarah@downtownspa.com",
    phone: "555-234-5678",
    address: "456 Elm St, Metropolis",
    status: "active",
    category: "Health & Wellness",
    joinDate: "2025-02-10",
    rating: 4,
    engagementScore: 72,
    lastActivity: "2025-04-15"
  },
  {
    id: "PRV003",
    name: "Riverfront Cafe",
    contactName: "David Brown",
    email: "david@riverfrontcafe.com",
    phone: "555-345-6789",
    address: "789 River Rd, Metropolis",
    status: "active",
    category: "Food & Beverage",
    joinDate: "2025-02-28",
    rating: 4,
    engagementScore: 68,
    lastActivity: "2025-04-10"
  },
  {
    id: "PRV004",
    name: "Metro Diner",
    contactName: "Jennifer Davis",
    email: "jennifer@metrodiner.com",
    phone: "555-456-7890",
    address: "101 Metro Ave, Metropolis",
    status: "inactive",
    category: "Food & Beverage",
    joinDate: "2025-03-05",
    rating: 3,
    engagementScore: 45,
    lastActivity: "2025-03-20"
  },
  {
    id: "PRV005",
    name: "Central Yoga Studio",
    contactName: "Lisa Miller",
    email: "lisa@centralyoga.com",
    phone: "555-567-8901",
    address: "202 Center St, Metropolis",
    status: "active",
    category: "Health & Fitness",
    joinDate: "2025-03-15",
    rating: 5,
    engagementScore: 90,
    lastActivity: "2025-04-20"
  },
  {
    id: "PRV006",
    name: "Sunrise Bakery",
    contactName: "Robert Wilson",
    email: "robert@sunrisebakery.com",
    phone: "555-678-9012",
    address: "303 Sunrise Blvd, Metropolis",
    status: "active",
    category: "Food & Beverage",
    joinDate: "2025-01-20",
    rating: 4,
    engagementScore: 78,
    lastActivity: "2025-04-12"
  }
];

// Voucher usage by category
const voucherEngagementData = [
  { category: "Health & Fitness", providers: 2, vouchersRedeemed: 340, totalVouchers: 500, avgScore: 87 },
  { category: "Food & Beverage", providers: 3, vouchersRedeemed: 210, totalVouchers: 450, avgScore: 63 },
  { category: "Health & Wellness", providers: 1, vouchersRedeemed: 95, totalVouchers: 150, avgScore: 72 }
];

// Network demographics
const networkDemographics = {
  totalProviders: providerAccounts.length,
  activeProviders: providerAccounts.filter(p => p.status === "active").length,
  totalVouchersRedeemed: 645,
  avgEngagement: Math.round(providerAccounts.reduce((s, p) => s + p.engagementScore, 0) / providerAccounts.length),
  topCategory: "Health & Fitness",
  cityBreakdown: [
    { city: "Metropolis", count: 6 },
  ],
};

const AccountManagementTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddProviderDialog, setShowAddProviderDialog] = useState(false);
  const [showProviderDetails, setShowProviderDetails] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<typeof providerAccounts[0] | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  
  const [newProvider, setNewProvider] = useState({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    category: ""
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewProvider({...newProvider, [name]: value});
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setNewProvider({...newProvider, [name]: value});
  };
  
  const handleAddProvider = () => {
    // Add validation here
    console.log("Adding new provider:", newProvider);
    
    toast("Provider added successfully", {
      description: `${newProvider.name} has been added to your provider network.`
    });
    
    // Reset form and close dialog
    setNewProvider({
      name: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      category: ""
    });
    setShowAddProviderDialog(false);
  };
  
  const handleViewProvider = (provider: typeof providerAccounts[0]) => {
    setSelectedProvider(provider);
    setShowProviderDetails(true);
  };
  
  const filteredProviders = providerAccounts.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         provider.contactName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || provider.status === filterStatus;
    const matchesCategory = filterCategory === "all" || provider.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });
  
  const categories = Array.from(new Set(providerAccounts.map(provider => provider.category)));

  const handleDownloadCSV = () => {
    const headers = ["ID", "Business Name", "Category", "Contact", "Email", "Phone", "Address", "Status", "Join Date", "Engagement Score"];
    const rows = providerAccounts.map(p => [p.id, p.name, p.category, p.contactName, p.email, p.phone, p.address, p.status, p.joinDate, p.engagementScore]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "partner-network-providers.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast("Download started", { description: "Provider data exported as CSV." });
  };

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
                <Input 
                  id="name" 
                  name="name" 
                  value={newProvider.name} 
                  onChange={handleInputChange} 
                  placeholder="Enter business name"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="category">Business Category</Label>
                <Select 
                  onValueChange={(value) => handleSelectChange("category", value)}
                  defaultValue={newProvider.category}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category, index) => (
                      <SelectItem key={index} value={category}>{category}</SelectItem>
                    ))}
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                    <SelectItem value="Professional Services">Professional Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="contactName">Contact Person</Label>
                <Input 
                  id="contactName" 
                  name="contactName" 
                  value={newProvider.contactName} 
                  onChange={handleInputChange} 
                  placeholder="Enter primary contact name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    value={newProvider.email} 
                    onChange={handleInputChange} 
                    placeholder="Enter email address"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    value={newProvider.phone} 
                    onChange={handleInputChange} 
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="address">Business Address</Label>
                <Input 
                  id="address" 
                  name="address" 
                  value={newProvider.address} 
                  onChange={handleInputChange} 
                  placeholder="Enter business address"
                />
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

      {/* Filters row */}
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
        
        <Select onValueChange={setFilterStatus} defaultValue="all">
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
        
        <Select onValueChange={setFilterCategory} defaultValue="all">
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <div className="flex items-center gap-1">
              <Filter className="h-3 w-3" />
              <span>Category</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category, index) => (
              <SelectItem key={index} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Provider table */}
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
                    <div className="text-[11px] text-muted-foreground">{provider.id}</div>
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-6 px-2 text-[11px]"
                        onClick={() => handleViewProvider(provider)}
                      >
                        View
                      </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Network Demographics & Provider Engagement by Voucher */}
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
            <div>
              <p className="text-xs font-medium mb-1.5">Category Distribution</p>
              {voucherEngagementData.map((item, index) => (
                <div key={index} className="mb-2">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs">{item.category}</span>
                    <span className="text-[11px] text-muted-foreground">{item.providers} providers</span>
                  </div>
                  <Progress value={(item.providers / providerAccounts.length) * 100} className="h-1.5" />
                </div>
              ))}
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
              {voucherEngagementData.map((item, index) => {
                const redemptionRate = Math.round((item.vouchersRedeemed / item.totalVouchers) * 100);
                return (
                  <div key={index} className="rounded-lg border p-3 space-y-2">
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
      
      {/* Provider Details Dialog */}
      <Dialog open={showProviderDetails} onOpenChange={setShowProviderDetails}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedProvider && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProvider.name}</DialogTitle>
                <DialogDescription>
                  Provider account details and management
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="details" className="mt-4">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="engagement">Engagement</TabsTrigger>
                  <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                </TabsList>
                
                <ScrollArea className="h-[350px]">
                  <div className="pr-3">
                    <TabsContent value="details" className="space-y-4 mt-0">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {selectedProvider.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{selectedProvider.name}</h3>
                            <p className="text-sm text-muted-foreground">{selectedProvider.category}</p>
                          </div>
                        </div>
                        <Badge className={selectedProvider.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {selectedProvider.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3 mt-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>Contact: {selectedProvider.contactName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedProvider.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedProvider.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedProvider.address}</span>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4 mt-4">
                        <h4 className="font-medium text-sm mb-2">Account Information</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">ID</p>
                            <p>{selectedProvider.id}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Join Date</p>
                            <p>{new Date(selectedProvider.joinDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Rating</p>
                            <p>{selectedProvider.rating}/5</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Last Activity</p>
                            <p>{new Date(selectedProvider.lastActivity).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="engagement" className="mt-0">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Engagement Score</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Current Score</span>
                              <span className="font-medium">{selectedProvider.engagementScore}%</span>
                            </div>
                            <Progress value={selectedProvider.engagementScore} className="h-2" />
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <h4 className="font-medium text-sm mb-2">Engagement History</h4>
                          <div className="h-48 border rounded-md flex items-center justify-center">
                            <div className="text-center">
                              <BarChart3 className="h-6 w-6 mx-auto text-muted-foreground" />
                              <p className="text-sm text-muted-foreground mt-2">
                                Engagement history chart would be displayed here
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-medium text-sm mb-2">Recent Activities</h4>
                          <div className="space-y-2">
                            <div className="text-sm pb-2 border-b">
                              <p className="font-medium">Participated in Spring Campaign</p>
                              <p className="text-xs text-muted-foreground">3 days ago</p>
                            </div>
                            <div className="text-sm pb-2 border-b">
                              <p className="font-medium">Updated business profile</p>
                              <p className="text-xs text-muted-foreground">1 week ago</p>
                            </div>
                            <div className="text-sm">
                              <p className="font-medium">Added new service offerings</p>
                              <p className="text-xs text-muted-foreground">2 weeks ago</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="campaigns" className="mt-0">
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm mb-2">Assigned Campaigns</h4>
                        
                        <div className="space-y-3">
                          <div className="border rounded-lg p-3">
                            <h5 className="font-medium mb-1">Summer Wellness Program</h5>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Progress</span>
                              <span>72%</span>
                            </div>
                            <Progress value={72} className="h-2 mb-2" />
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Active until Aug 31, 2025</span>
                              <Badge variant="outline" className="text-xs">Email</Badge>
                            </div>
                          </div>
                          
                          <div className="border rounded-lg p-3">
                            <h5 className="font-medium mb-1">New Provider Onboarding</h5>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Progress</span>
                              <span>85%</span>
                            </div>
                            <Progress value={85} className="h-2 mb-2" />
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Active until Jul 31, 2025</span>
                              <Badge variant="outline" className="text-xs">Email</Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <Button variant="outline" size="sm" className="w-full">
                            Assign to Campaign
                          </Button>
                        </div>
                        
                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-medium text-sm mb-2">Campaign Performance</h4>
                          <div className="h-40 border rounded-md flex items-center justify-center">
                            <p className="text-sm text-muted-foreground">
                              Campaign performance visualization would be displayed here
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>
              
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setShowProviderDetails(false)}>Close</Button>
                <Button>Message Provider</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountManagementTab;
