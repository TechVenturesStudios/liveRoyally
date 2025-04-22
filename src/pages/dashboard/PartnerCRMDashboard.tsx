
import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, BarChart3, Link, Users } from "lucide-react";
import MessagingTab from "@/components/crm/MessagingTab";
import CampaignManagementTab from "@/components/crm/CampaignManagementTab";
import IntegrationsTab from "@/components/crm/IntegrationsTab";
import AccountManagementTab from "@/components/crm/AccountManagementTab";

const PartnerCRMDashboard = () => {
  const [activeTab, setActiveTab] = useState("messaging");
  
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold royal-header">Partner CRM Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage your relationships with providers and track engagement
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total Providers</p>
                <p className="text-2xl font-bold text-blue-900">24</p>
              </div>
              <div className="rounded-full p-3 bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Open Campaigns</p>
                <p className="text-2xl font-bold text-green-900">7</p>
              </div>
              <div className="rounded-full p-3 bg-green-100">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Active Integrations</p>
                <p className="text-2xl font-bold text-purple-900">3</p>
              </div>
              <div className="rounded-full p-3 bg-purple-100">
                <Link className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-800">Unread Messages</p>
                <p className="text-2xl font-bold text-amber-900">12</p>
              </div>
              <div className="rounded-full p-3 bg-amber-100">
                <MessageSquare className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs 
        defaultValue="messaging" 
        className="w-full"
        onValueChange={(value) => setActiveTab(value)}
      >
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="messaging" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>Messaging</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Campaigns</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            <span>Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Accounts</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="messaging">
          <MessagingTab />
        </TabsContent>
        
        <TabsContent value="campaigns">
          <CampaignManagementTab />
        </TabsContent>
        
        <TabsContent value="integrations">
          <IntegrationsTab />
        </TabsContent>
        
        <TabsContent value="accounts">
          <AccountManagementTab />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default PartnerCRMDashboard;
