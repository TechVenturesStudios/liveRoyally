
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PartnerUser } from "@/types/user";

// Mock data for partners
const mockPartners: PartnerUser[] = [
  {
    id: "PRT001",
    networkName: "Royal Network",
    networkCode: "ROYAL1",
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
    networkName: "Royal Network",
    networkCode: "ROYAL1",
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
    networkName: "Royal Network",
    networkCode: "ROYAL1",
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

const PartnersDashboard = () => {
  const [partners, setPartners] = useState<PartnerUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch partners from API
    setPartners(mockPartners);
    setIsLoading(false);
  }, []);

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
        <h1 className="text-3xl font-bold royal-header">Partners Management</h1>
        <p className="text-gray-600 mt-2">
          View and manage all partners in the Live Royally network
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Partners</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-royal">{partners.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Partners</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{partners.filter(p => p.notificationEnabled).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Inactive Partners</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{partners.filter(p => !p.notificationEnabled).length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Partner Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Organization Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Agent Name</TableHead>
                  <TableHead>Contact Email</TableHead>
                  <TableHead>Contact Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">{partner.id}</TableCell>
                    <TableCell>{partner.organizationName}</TableCell>
                    <TableCell>{partner.organizationCategory}</TableCell>
                    <TableCell>{`${partner.agentFirstName} ${partner.agentLastName}`}</TableCell>
                    <TableCell>{partner.organizationEmail}</TableCell>
                    <TableCell>{partner.organizationPhone}</TableCell>
                    <TableCell>{`${partner.organizationCity}, ${partner.organizationState}`}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${partner.notificationEnabled ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {partner.notificationEnabled ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default PartnersDashboard;
