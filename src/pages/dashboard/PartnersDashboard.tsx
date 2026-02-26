
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PartnerUser } from "@/types/user";
import {
  CalendarDays,
  Calendar,
  Clock,
  ArrowUpDown,
  PlusCircle,
  Medal,
  UserPlus,
  BarChart3,
  ChevronUp,
  ChevronDown,
  CheckCircle
} from "lucide-react";

// Mock data for partners
const mockPartners: PartnerUser[] = [
  {
    id: "PRT001",
    partnerCode: "PTR-ABC123",
    networkName: "Baton Rouge Network",
    networkCode: "BR-001",
    email: "partner1@example.com",
    userType: "partner",
    notificationEnabled: true,
    termsAccepted: true,
    agentFirstName: "David",
    agentLastName: "Miller",
    agentPhone: "555-111-2222",
    organizationName: "City Community Foundation",
    organizationAddress: "100 Civic Plaza",
    organizationCity: "Metropolis",
    organizationState: "NY",
    organizationZip: "10001",
    organizationCategory: "Non-Profit",
    organizationEmail: "info@cityfoundation.org",
    organizationPhone: "555-333-4444"
  },
  {
    id: "PRT002",
    partnerCode: "PTR-DEF456",
    networkName: "Lafayette Network",
    networkCode: "LAF-002",
    email: "partner2@example.com",
    userType: "partner",
    notificationEnabled: true,
    termsAccepted: true,
    agentFirstName: "Sarah",
    agentLastName: "Wilson",
    agentPhone: "555-222-3333",
    organizationName: "Downtown Business Alliance",
    organizationAddress: "200 Commerce St",
    organizationCity: "Springfield",
    organizationState: "IL",
    organizationZip: "62701",
    organizationCategory: "Business Association",
    organizationEmail: "info@downtownalliance.org",
    organizationPhone: "555-444-5555"
  },
  {
    id: "PRT003",
    partnerCode: "PTR-GHI789",
    networkName: "New Orleans Network",
    networkCode: "NOLA-003",
    email: "partner3@example.com",
    userType: "partner",
    notificationEnabled: false,
    termsAccepted: true,
    agentFirstName: "Robert",
    agentLastName: "Jones",
    agentPhone: "555-333-4444",
    organizationName: "Jones Event Planning",
    organizationAddress: "300 Event Ave",
    organizationCity: "Eventville",
    organizationState: "CA",
    organizationZip: "90210",
    organizationCategory: "Event Management",
    organizationEmail: "info@jonesevents.com",
    organizationPhone: "555-555-6666"
  }
];

// Mock data for events
const mockEvents = [
  {
    id: "EVT001",
    title: "Community Spring Festival",
    description: "Annual celebration of local arts and crafts",
    location: "City Park",
    date: "2025-05-15",
    deadline: "2025-05-01",
    status: "pending",
    purchaseCount: 124,
    contacts: [
      { id: "USR001", name: "David Miller", role: "Publisher" },
      { id: "USR002", name: "Sarah Wilson", role: "Approver" }
    ]
  },
  {
    id: "EVT002",
    title: "Downtown Business Expo",
    description: "Network with local business leaders",
    location: "Convention Center",
    date: "2025-06-20",
    deadline: "2025-06-05",
    status: "published",
    purchaseCount: 85,
    contacts: [
      { id: "USR001", name: "David Miller", role: "Publisher" },
      { id: "USR003", name: "James Johnson", role: "Creator" }
    ]
  },
  {
    id: "EVT003",
    title: "Winter Charity Gala",
    description: "Fundraising event for local charities",
    location: "Grand Ballroom",
    date: "2024-12-10",
    deadline: "2024-11-30",
    status: "completed",
    purchaseCount: 210,
    contacts: [
      { id: "USR001", name: "David Miller", role: "Publisher" },
      { id: "USR002", name: "Sarah Wilson", role: "Approver" },
      { id: "USR003", name: "James Johnson", role: "Creator" }
    ]
  },
  {
    id: "EVT004",
    title: "Tech Innovation Showcase",
    description: "Featuring the latest in local tech startups",
    location: "Tech Hub",
    date: "2025-07-05",
    deadline: "2025-06-20",
    status: "pending",
    purchaseCount: 0,
    contacts: [
      { id: "USR002", name: "Sarah Wilson", role: "Publisher" },
      { id: "USR003", name: "James Johnson", role: "Approver" }
    ]
  },
  {
    id: "EVT005",
    title: "Summer Food Festival",
    description: "Celebration of local cuisine and restaurants",
    location: "Downtown Plaza",
    date: "2024-08-12",
    deadline: "2024-07-29",
    status: "completed",
    purchaseCount: 175,
    contacts: [
      { id: "USR001", name: "David Miller", role: "Publisher" },
      { id: "USR002", name: "Sarah Wilson", role: "Approver" }
    ]
  }
];

// Mock data for contacts
const mockContacts = [
  { id: "USR001", name: "David Miller", email: "david@example.com", role: "Publisher", type: "member" },
  { id: "USR002", name: "Sarah Wilson", email: "sarah@example.com", role: "Approver", type: "member" },
  { id: "USR003", name: "James Johnson", email: "james@example.com", role: "Creator", type: "provider" }
];

const PartnersDashboard = () => {
  const [partner, setPartner] = useState<PartnerUser | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [historicalEvents, setHistoricalEvents] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showAddContact, setShowAddContact] = useState(false);
  const [networkScore, setNetworkScore] = useState(850);

  useEffect(() => {
    // In a real app, fetch partner data from API
    setPartner(mockPartners[0]);
    setContacts(mockContacts);
    
    // Sort events based on current direction
    const sortedEvents = [...mockEvents].sort((a, b) => {
      return sortDirection === "asc" 
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    setEvents(sortedEvents);
    setPendingEvents(sortedEvents.filter(event => event.status === "pending"));
    setHistoricalEvents(sortedEvents.filter(event => event.status === "completed"));
    
    setIsLoading(false);
  }, [sortDirection]);

  const handleSort = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  const handleSetDeadline = (eventId: string, newDeadline: string) => {
    // In a real app, this would update the deadline in the database
    const updatedEvents = events.map(event => 
      event.id === eventId ? { ...event, deadline: newDeadline } : event
    );
    setEvents(updatedEvents);
    setPendingEvents(updatedEvents.filter(event => event.status === "pending"));
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
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-bold royal-header">Partner Dashboard</h1>
        <p className="text-gray-600 text-xs sm:text-base mt-1 sm:mt-2">
          Manage your organization's events and engagement in the Live Royally network
        </p>
      </div>

      {/* Mobile: compact KPI row */}
      <div className="flex sm:hidden gap-1.5 mb-4">
        <div className="flex-1 px-2 py-1.5 rounded-md bg-purple-50 text-left">
          <p className="text-[9px] font-medium text-purple-800 truncate">Pending</p>
          <p className="text-xs font-bold text-purple-900">{pendingEvents.length}</p>
        </div>
        <div className="flex-1 px-2 py-1.5 rounded-md bg-green-50 text-left">
          <p className="text-[9px] font-medium text-green-800 truncate">Purchases</p>
          <p className="text-xs font-bold text-green-900">{events.reduce((sum, event) => sum + event.purchaseCount, 0)}</p>
        </div>
        <div className="flex-1 flex items-center gap-1 px-2 py-1.5 rounded-md bg-amber-50 text-left">
          <Medal className="h-3 w-3 text-amber-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] font-medium text-amber-800 truncate">Score</p>
            <p className="text-xs font-bold text-amber-900">{networkScore}</p>
          </div>
        </div>
      </div>

      {/* Desktop: full KPI cards */}
      <div className="hidden sm:grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-royal" />
              Pending Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-royal">{pendingEvents.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Total Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {events.reduce((sum, event) => sum + event.purchaseCount, 0)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Medal className="h-5 w-5 text-amber-600" />
              Network Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{networkScore}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-8">
        <div className="lg:col-span-2">
          <Card className="mb-3 sm:mb-6">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <div className="flex justify-between items-center gap-2">
                <CardTitle className="text-sm sm:text-base">Event Management</CardTitle>
                <Button size="sm" className="bg-royal hover:bg-royal/90 text-xs sm:text-sm" onClick={() => console.log("Create event")}>
                  <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Create Event</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4 h-auto">
                  <TabsTrigger value="pending" className="text-[10px] sm:text-sm py-1.5">Pending</TabsTrigger>
                  <TabsTrigger value="historical" className="text-[10px] sm:text-sm py-1.5">Historical</TabsTrigger>
                  <TabsTrigger value="all" className="text-[10px] sm:text-sm py-1.5">All Events</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pending" className="space-y-4">
                  <div className="flex justify-end mb-2">
                    <Button variant="outline" size="sm" onClick={handleSort} className="flex items-center gap-1">
                      <span>Date</span>
                      {sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Deadline</TableHead>
                          <TableHead>Contacts</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingEvents.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium">{event.title}</TableCell>
                            <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <input 
                                type="date" 
                                defaultValue={event.deadline}
                                className="border rounded px-2 py-1 text-sm"
                                onChange={(e) => handleSetDeadline(event.id, e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex -space-x-2">
                                {event.contacts.map((contact: any, i: number) => (
                                  <Avatar key={i} className="h-6 w-6 border border-white">
                                    <AvatarFallback className="text-xs">
                                      {contact.name.split(' ').map((n: string) => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">Edit</Button>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">Publish</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="historical" className="space-y-4">
                  <div className="flex justify-end mb-2">
                    <Button variant="outline" size="sm" onClick={handleSort} className="flex items-center gap-1">
                      <span>Date</span>
                      {sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Purchases</TableHead>
                          <TableHead>Contacts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historicalEvents.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium">{event.title}</TableCell>
                            <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {event.purchaseCount} purchases
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex -space-x-2">
                                {event.contacts.map((contact: any, i: number) => (
                                  <Avatar key={i} className="h-6 w-6 border border-white">
                                    <AvatarFallback className="text-xs">
                                      {contact.name.split(' ').map((n: string) => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="all" className="space-y-4">
                  <div className="flex justify-end mb-2">
                    <Button variant="outline" size="sm" onClick={handleSort} className="flex items-center gap-1">
                      <span>Date</span>
                      {sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Purchases</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {events.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium">{event.title}</TableCell>
                            <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge className={
                                event.status === "pending" 
                                  ? "bg-amber-100 text-amber-800 border-amber-200" 
                                  : event.status === "published" 
                                    ? "bg-blue-100 text-blue-800 border-blue-200"
                                    : "bg-green-100 text-green-800 border-green-200"
                              }>
                                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{event.purchaseCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Account Profile</span>
                {partner && (
                  <Badge className="bg-royal/10 text-royal border-royal/20">
                    {partner.networkName}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {partner?.organizationName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Organization Details</h4>
                <p className="text-sm text-gray-500">{partner?.organizationAddress}</p>
                <p className="text-sm text-gray-500">{partner?.organizationCity}, {partner?.organizationState} {partner?.organizationZip}</p>
                <p className="text-sm text-gray-500">{partner?.organizationEmail}</p>
                <p className="text-sm text-gray-500">{partner?.organizationPhone}</p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Authorized Contacts (3 max)</h4>
                  {contacts.length < 3 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 px-2 text-royal" 
                      onClick={() => setShowAddContact(!showAddContact)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      <span>Add</span>
                    </Button>
                  )}
                </div>
                
                {showAddContact && (
                  <div className="border rounded-md p-3 mb-4 bg-muted/50">
                    <h5 className="text-sm font-medium mb-2">Add Contact</h5>
                    <div className="space-y-2">
                      <input 
                        type="email" 
                        placeholder="Enter email address" 
                        className="w-full px-3 py-1 text-sm border rounded"
                      />
                      <select className="w-full px-3 py-1 text-sm border rounded">
                        <option value="">Select role</option>
                        <option value="publisher">Publisher</option>
                        <option value="approver">Approver</option>
                        <option value="creator">Creator</option>
                      </select>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowAddContact(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            console.log("Add contact");
                            setShowAddContact(false);
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  {contacts.map((contact, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted/20 rounded p-2">
                      <div>
                        <p className="text-sm font-medium">{contact.name}</p>
                        <p className="text-xs text-gray-500">{contact.role} • {contact.email}</p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {contact.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Medal className="h-5 w-5 text-royal" />
                Network Engagement
              </CardTitle>
              <CardDescription>Your performance in the network</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Network Score</span>
                  <span className="font-medium">{networkScore}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-royal rounded-full" 
                    style={{ width: `${Math.min(networkScore / 10, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="pt-2">
                <h4 className="text-sm font-medium mb-2">Performance Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-royal" />
                      Events Created
                    </span>
                    <span className="font-medium">{events.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                      Completed Events
                    </span>
                    <span className="font-medium">{historicalEvents.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <BarChart3 className="h-4 w-4 mr-1 text-amber-600" />
                      Total Purchases
                    </span>
                    <span className="font-medium">
                      {events.reduce((sum, event) => sum + event.purchaseCount, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="outline" className="w-full" onClick={() => console.log("View full stats")}>
                View Detailed Analytics
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PartnersDashboard;
