
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
import { Search, Filter, UserPlus, Users, Phone, Mail, MapPin, MoreHorizontal, BarChart3 } from "lucide-react";
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

// Sample engagement data
const engagementData = [
  { category: "Health & Fitness", count: 2, score: 87 },
  { category: "Food & Beverage", count: 3, score: 63 },
  { category: "Health & Wellness", count: 1, score: 72 }
];

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">Provider Accounts</h2>
        
        <Dialog open={showAddProviderDialog} onOpenChange={setShowAddProviderDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Provider
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
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Provider Network</CardTitle>
              <CardDescription>Manage your provider relationships</CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search providers..." 
                  className="pl-8 w-[200px] md:w-[300px]" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select onValueChange={setFilterStatus} defaultValue="all">
                <SelectTrigger className="w-[130px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
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
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
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
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProviders.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell>
                    <div className="font-medium">{provider.name}</div>
                    <div className="text-xs text-muted-foreground">ID: {provider.id}</div>
                  </TableCell>
                  <TableCell>{provider.category}</TableCell>
                  <TableCell>
                    <div className="text-sm">{provider.contactName}</div>
                    <div className="text-xs text-muted-foreground">{provider.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={provider.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {provider.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={provider.engagementScore} className="h-2 w-16" />
                      <span className="text-sm">{provider.engagementScore}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewProvider(provider)}
                      >
                        View
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="px-2"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Network Demographics</CardTitle>
            <CardDescription>Provider category distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {engagementData.map((item, index) => (
              <div key={index} className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{item.category}</span>
                  <span className="text-sm text-muted-foreground">{item.count} providers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(item.count / providerAccounts.length) * 100} 
                    className="h-2 flex-1" 
                  />
                  <span className="text-xs text-muted-foreground">
                    {Math.round((item.count / providerAccounts.length) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Provider Engagement</CardTitle>
            <CardDescription>Engagement metrics by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground">Engagement chart visualization would be displayed here</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Showing engagement levels across provider categories
                </p>
              </div>
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
                
                <TabsContent value="details" className="space-y-4">
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
                
                <TabsContent value="engagement">
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
                
                <TabsContent value="campaigns">
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
