
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProviderUser } from "@/types/user";

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

const ProvidersDashboard = () => {
  const [providers, setProviders] = useState<ProviderUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch providers from API
    setProviders(mockProviders);
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
        <h1 className="text-3xl font-bold royal-header">Providers Management</h1>
        <p className="text-gray-600 mt-2">
          View and manage all providers in the Live Royally network
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-royal">{providers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{providers.filter(p => p.notificationEnabled).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Inactive Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{providers.filter(p => !p.notificationEnabled).length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Provider Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Agent Name</TableHead>
                  <TableHead>Contact Email</TableHead>
                  <TableHead>Contact Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-medium">{provider.id}</TableCell>
                    <TableCell>{provider.businessName}</TableCell>
                    <TableCell>{provider.businessCategory}</TableCell>
                    <TableCell>{`${provider.agentFirstName} ${provider.agentLastName}`}</TableCell>
                    <TableCell>{provider.businessEmail}</TableCell>
                    <TableCell>{provider.businessPhone}</TableCell>
                    <TableCell>{`${provider.businessCity}, ${provider.businessState}`}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${provider.notificationEnabled ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {provider.notificationEnabled ? 'Active' : 'Inactive'}
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

export default ProvidersDashboard;
