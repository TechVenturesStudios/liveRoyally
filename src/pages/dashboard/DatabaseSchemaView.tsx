
import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, FileText } from "lucide-react";
import SchemaTable from "@/components/database/SchemaTable";
import ReportsGrid from "@/components/database/ReportsGrid";
import ImplementationRecommendations from "@/components/database/ImplementationRecommendations";

const DatabaseSchemaView = () => {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold royal-header">Database Schema</h1>
        <p className="text-gray-600 mt-2">
          Overview of database structure for tracking voucher redemptions
        </p>
      </div>

      <Tabs defaultValue="schema" className="w-full">
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="schema" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>Database Schema</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Available Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schema">
          <SchemaTable />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsGrid />
        </TabsContent>
      </Tabs>

      <ImplementationRecommendations />
    </DashboardLayout>
  );
};

export default DatabaseSchemaView;
