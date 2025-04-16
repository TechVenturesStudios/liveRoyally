
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, PlusCircle, User } from "lucide-react";
import { ProviderUser } from "@/types/user";
import { mockProviders, mockEvents, mockAuthorizedReps, mockNetworkMembers } from "@/data/providerMockData";

// Import the new components
import ProviderStatsCards from "@/components/providers/ProviderStatsCards";
import PendingEventsTab from "@/components/providers/PendingEventsTab";
import RepresentativesTab from "@/components/providers/RepresentativesTab";
import HistoricalEventsTab from "@/components/providers/HistoricalEventsTab";
import UpcomingEventsTab from "@/components/providers/UpcomingEventsTab";

const ProvidersDashboard = () => {
  const [provider, setProvider] = useState<ProviderUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState(mockEvents);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [authorizedReps, setAuthorizedReps] = useState(mockAuthorizedReps);
  const [networkMembers, setNetworkMembers] = useState(mockNetworkMembers);

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

  const handleAddRepresentative = (selectedMemberId: string) => {
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
    }
  };

  const getPendingEventsCount = () => {
    return events.filter(event => event.status === "pending").length;
  };

  const getHistoricalEventsCount = () => {
    return events.filter(event => event.status === "completed" && event.participated).length;
  };

  const getUpcomingEventsCount = () => {
    return events.filter(event => event.status === "active").length;
  };

  const calculateNetworkScore = () => {
    return events
      .filter(event => event.status === "completed" && event.participated)
      .reduce((total, event) => total + event.networkScore, 0);
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
        <ProviderStatsCards 
          provider={provider} 
          eventStats={{
            pending: getPendingEventsCount(),
            historical: getHistoricalEventsCount(),
            upcoming: getUpcomingEventsCount()
          }}
          networkScore={calculateNetworkScore()}
        />
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
          <PendingEventsTab 
            events={events} 
            sortOrder={sortOrder} 
            toggleSortOrder={toggleSortOrder} 
          />
        </TabsContent>
        
        <TabsContent value="representatives">
          <RepresentativesTab 
            representatives={authorizedReps}
            networkMembers={networkMembers}
            onAddRepresentative={handleAddRepresentative}
          />
        </TabsContent>
        
        <TabsContent value="historical">
          <HistoricalEventsTab
            events={events}
            sortOrder={sortOrder}
            toggleSortOrder={toggleSortOrder}
          />
        </TabsContent>
        
        <TabsContent value="upcoming">
          <UpcomingEventsTab
            events={events}
            sortOrder={sortOrder}
            toggleSortOrder={toggleSortOrder}
          />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default ProvidersDashboard;
