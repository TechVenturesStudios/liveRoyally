
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProviderUser } from "@/types/user";
import { 
  ArrowDownUp, 
  Calendar, 
  Clock, 
  PlusCircle, 
  Medal, 
  User,
  Building, 
  ArrowUp, 
  ArrowDown,
  CheckCircle2,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data for providers
const mockProviders: ProviderUser[] = [
  {
    id: "PRV001",
    networkName: "Royal Network",
    networkCode: "ROYAL1",
    email: "provider1@example.com",
    userType: "provider",
    notificationEnabled: true,
    termsAccepted: true,
    agentFirstName: "John",
    agentLastName: "Smith",
    agentPhone: "555-123-4567",
    businessName: "Smith's Merchandise",
    businessCategory: "Retail",
    businessAddress: "123 Commerce St",
    businessCity: "Metropolis",
    businessState: "NY",
    businessZip: "10001",
    businessEmail: "info@smithmerch.com",
    businessPhone: "555-987-6543"
  },
  {
    id: "PRV002",
    networkName: "Royal Network",
    networkCode: "ROYAL1",
    email: "provider2@example.com",
    userType: "provider",
    notificationEnabled: true,
    termsAccepted: true,
    agentFirstName: "Emma",
    agentLastName: "Johnson",
    agentPhone: "555-234-5678",
    businessName: "Johnson Cafe",
    businessCategory: "Food & Beverage",
    businessAddress: "456 Main St",
    businessCity: "Springfield",
    businessState: "IL",
    businessZip: "62701",
    businessEmail: "info@johnsoncafe.com",
    businessPhone: "555-876-5432"
  },
  {
    id: "PRV003",
    networkName: "Royal Network",
    networkCode: "ROYAL1",
    email: "provider3@example.com",
    userType: "provider",
    notificationEnabled: false,
    termsAccepted: true,
    agentFirstName: "Michael",
    agentLastName: "Williams",
    agentPhone: "555-345-6789",
    businessName: "Williams Fitness",
    businessCategory: "Health & Wellness",
    businessAddress: "789 Gym Ave",
    businessCity: "Fitsville",
    businessState: "CA",
    businessZip: "90210",
    businessEmail: "info@williamsfitness.com",
    businessPhone: "555-765-4321"
  }
];

// Mock events data
const mockEvents = [
  {
    id: "EVT001",
    title: "Summer Market Festival",
    status: "pending", // pending, active, completed
    date: "2025-06-15",
    time: "10:00 AM - 4:00 PM",
    location: "Downtown Plaza",
    description: "A vibrant market showcasing local businesses and artisans",
    organizer: "City Business Association",
    participated: false,
    networkScore: 150
  },
  {
    id: "EVT002",
    title: "Business Networking Expo",
    status: "pending",
    date: "2025-05-20",
    time: "6:00 PM - 9:00 PM",
    location: "Grand Hotel Conference Center",
    description: "Connect with other businesses in the Royal Network",
    organizer: "Chamber of Commerce",
    participated: false,
    networkScore: 200
  },
  {
    id: "EVT003",
    title: "Spring Community Fair",
    status: "completed",
    date: "2025-03-28",
    time: "11:00 AM - 5:00 PM",
    location: "Central Park",
    description: "Annual community gathering with local vendors and entertainment",
    organizer: "Parks Department",
    participated: true,
    networkScore: 175
  },
  {
    id: "EVT004",
    title: "Holiday Shopping Event",
    status: "completed",
    date: "2024-12-15",
    time: "12:00 PM - 8:00 PM",
    location: "Shopping District",
    description: "Special holiday promotion event for local shops",
    organizer: "Business Improvement District",
    participated: true,
    networkScore: 225
  },
  {
    id: "EVT005",
    title: "Small Business Showcase",
    status: "active",
    date: "2025-07-10",
    time: "10:00 AM - 3:00 PM",
    location: "Convention Center",
    description: "Showcase your products and services to the community",
    organizer: "Small Business Association",
    participated: false,
    networkScore: 300
  }
];

// Mock authorized representatives
const mockAuthorizedReps = [
  {
    id: "USR001",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "555-111-2222",
    role: "Primary Representative",
    status: "active"
  },
  {
    id: "USR002",
    name: "Michael Chen",
    email: "michael@example.com",
    phone: "555-333-4444",
    role: "Secondary Representative",
    status: "active"
  }
];

// Mock network members for authorized representative selection
const mockNetworkMembers = [
  {
    id: "MEM001",
    name: "Alex Turner",
    email: "alex@example.com",
    memberSince: "2024-01-15"
  },
  {
    id: "MEM002",
    name: "Jessica Williams",
    email: "jessica@example.com",
    memberSince: "2024-02-03"
  },
  {
    id: "MEM003",
    name: "David Miller",
    email: "david@example.com",
    memberSince: "2024-03-21"
  }
];

const ProvidersDashboard = () => {
  const [provider, setProvider] = useState<ProviderUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState(mockEvents);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [authorizedReps, setAuthorizedReps] = useState(mockAuthorizedReps);
  const [networkMembers, setNetworkMembers] = useState(mockNetworkMembers);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // In a real app, fetch provider details from API
    setProvider(mockProviders[0]); // Just display the first provider for demo
    setIsLoading(false);
  }, []);

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    
    // Sort events by date
    const sortedEvents = [...events].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return newOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
    
    setEvents(sortedEvents);
  };

  const handleAddRepresentative = () => {
    if (!selectedMemberId) {
      toast({
        title: "Error",
        description: "Please select a member to add as a representative",
        variant: "destructive"
      });
      return;
    }

    const selectedMember = networkMembers.find(member => member.id === selectedMemberId);
    if (selectedMember) {
      const newRep = {
        id: selectedMember.id,
        name: selectedMember.name,
        email: selectedMember.email,
        phone: "Not provided",
        role: "Assistant Representative",
        status: "active"
      };
      
      setAuthorizedReps([...authorizedReps, newRep]);
      
      toast({
        title: "Representative Added",
        description: `${selectedMember.name} has been added as a representative`
      });
      
      setSelectedMemberId("");
    }
  };

  const getPendingEvents = () => {
    return events.filter(event => event.status === "pending");
  };

  const getHistoricalEvents = () => {
    return events.filter(event => event.status === "completed" && event.participated);
  };

  const getUpcomingEvents = () => {
    return events.filter(event => event.status === "active");
  };

  const calculateNetworkScore = () => {
    return getHistoricalEvents().reduce((total, event) => total + event.networkScore, 0);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold royal-header">Provider Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage your business participation in the Live Royally network
        </p>
      </div>

      {provider && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Business Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16 border-2 border-royal">
                  <AvatarFallback className="bg-royal text-white text-lg">
                    {provider.businessName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-xl">{provider.businessName}</h3>
                  <p className="text-gray-500">{provider.businessCategory}</p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Contact:</span> {provider.businessEmail}</p>
                <p><span className="font-medium">Phone:</span> {provider.businessPhone}</p>
                <p><span className="font-medium">Location:</span> {provider.businessCity}, {provider.businessState}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Participation Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending Events</span>
                  <Badge variant="outline" className="bg-amber-50">{getPendingEvents().length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Historical Events</span>
                  <Badge variant="outline" className="bg-blue-50">{getHistoricalEvents().length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Upcoming Events</span>
                  <Badge variant="outline" className="bg-green-50">{getUpcomingEvents().length}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Network Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="bg-royal/10 p-3 rounded-full">
                  <Medal className="h-8 w-8 text-royal" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-royal">{calculateNetworkScore()}</p>
                  <p className="text-gray-500 text-sm">Participation Points</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>Level: Gold Provider</p>
                <p>Next level at: 1000 points</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="pending" className="mb-6">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Pending Events</span>
          </TabsTrigger>
          <TabsTrigger value="representatives" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Representatives</span>
          </TabsTrigger>
          <TabsTrigger value="historical" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Historical Events</span>
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>Upcoming Events</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pending Events</CardTitle>
                <CardDescription>Events you've accepted to participate in</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleSortOrder}
                className="flex items-center gap-1"
              >
                <span>Date</span>
                {sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Organizer</TableHead>
                      <TableHead>Network Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPendingEvents().length > 0 ? getPendingEvents().map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.title}</TableCell>
                        <TableCell>{event.date}</TableCell>
                        <TableCell>{event.time}</TableCell>
                        <TableCell>{event.location}</TableCell>
                        <TableCell>{event.organizer}</TableCell>
                        <TableCell>{event.networkScore}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                          No pending events found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="representatives">
          <Card>
            <CardHeader>
              <CardTitle>Authorized Representatives</CardTitle>
              <CardDescription>
                Manage who can represent your business at events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h3 className="text-md font-medium mb-3">Current Representatives</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {authorizedReps.map((rep) => (
                        <TableRow key={rep.id}>
                          <TableCell className="font-medium">{rep.name}</TableCell>
                          <TableCell>{rep.email}</TableCell>
                          <TableCell>{rep.phone}</TableCell>
                          <TableCell>{rep.role}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {rep.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-md font-medium mb-3">Add New Representative</h3>
                <p className="text-sm text-gray-500 mb-4">Select a member from your network to add as an authorized representative</p>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-3">
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={selectedMemberId}
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                    >
                      <option value="">Select a member...</option>
                      {networkMembers.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={handleAddRepresentative} className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    Add Representative
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="historical">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Historical Events</CardTitle>
                <CardDescription>Events you've participated in</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleSortOrder}
                className="flex items-center gap-1"
              >
                <span>Date</span>
                {sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Organizer</TableHead>
                      <TableHead>Network Points Earned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getHistoricalEvents().length > 0 ? getHistoricalEvents().map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.title}</TableCell>
                        <TableCell>{event.date}</TableCell>
                        <TableCell>{event.location}</TableCell>
                        <TableCell>{event.organizer}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Medal className="h-4 w-4 text-royal" />
                            <span className="font-medium">{event.networkScore}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                          No historical events found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="upcoming">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>New opportunities to participate in the network</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleSortOrder}
                className="flex items-center gap-1"
              >
                <span>Date</span>
                {sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Potential Points</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getUpcomingEvents().length > 0 ? getUpcomingEvents().map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.title}</TableCell>
                        <TableCell>{event.date}</TableCell>
                        <TableCell>{event.time}</TableCell>
                        <TableCell>{event.location}</TableCell>
                        <TableCell>{event.networkScore}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            onClick={() => {
                              toast({
                                title: "Success",
                                description: `You've signed up for ${event.title}`,
                              });
                            }}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Sign Up
                          </Button>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                          No upcoming events found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default ProvidersDashboard;
