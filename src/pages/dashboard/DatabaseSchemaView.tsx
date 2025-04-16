import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

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
          <Card>
            <CardHeader>
              <CardTitle>Voucher Redemption Tracking Schema</CardTitle>
              <CardDescription>
                Database structure for tracking all voucher redemptions and validations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column Name</TableHead>
                    <TableHead>Data Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Example Value</TableHead>
                    <TableHead>Required</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">redemption_id</TableCell>
                    <TableCell>uuid</TableCell>
                    <TableCell>Unique identifier for each redemption record</TableCell>
                    <TableCell>b5d2d8e4-3cc9-4b2a-91d3-6c71b3847c22</TableCell>
                    <TableCell>Yes</TableCell>
                  </TableRow>
                  <TableRow className="bg-blue-50">
                    <TableCell className="font-medium">user_id</TableCell>
                    <TableCell>string</TableCell>
                    <TableCell>Unique identifier of the member using the voucher</TableCell>
                    <TableCell>30001</TableCell>
                    <TableCell>Yes</TableCell>
                  </TableRow>
                  <TableRow className="bg-blue-50">
                    <TableCell className="font-medium">network_id</TableCell>
                    <TableCell>string</TableCell>
                    <TableCell>Network identifier (e.g., royal)</TableCell>
                    <TableCell>royal</TableCell>
                    <TableCell>Yes</TableCell>
                  </TableRow>
                  <TableRow className="bg-blue-50">
                    <TableCell className="font-medium">event_id</TableCell>
                    <TableCell>string</TableCell>
                    <TableCell>Identifier for the event where voucher was distributed</TableCell>
                    <TableCell>EV0001</TableCell>
                    <TableCell>Yes</TableCell>
                  </TableRow>
                  <TableRow className="bg-blue-50">
                    <TableCell className="font-medium">voucher_id</TableCell>
                    <TableCell>string</TableCell>
                    <TableCell>Unique identifier for the voucher</TableCell>
                    <TableCell>VC12345</TableCell>
                    <TableCell>Yes</TableCell>
                  </TableRow>
                  <TableRow className="bg-blue-50">
                    <TableCell className="font-medium">redemption_date</TableCell>
                    <TableCell>timestamp</TableCell>
                    <TableCell>Date and time when the voucher was redeemed</TableCell>
                    <TableCell>2025-04-16T14:32:21Z</TableCell>
                    <TableCell>Yes</TableCell>
                  </TableRow>
                  <TableRow className="bg-blue-50">
                    <TableCell className="font-medium">zip_code</TableCell>
                    <TableCell>string</TableCell>
                    <TableCell>Zip code of the user</TableCell>
                    <TableCell>90210</TableCell>
                    <TableCell>Yes</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">gender</TableCell>
                    <TableCell>integer</TableCell>
                    <TableCell>Gender of the user (1: Male, 2: Female, 3: Other)</TableCell>
                    <TableCell>2</TableCell>
                    <TableCell>Yes</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">age_range</TableCell>
                    <TableCell>integer</TableCell>
                    <TableCell>Age range of the user (1: 18-24, 2: 25-34, 3: 35-44, 4: 45-54, 5: 55-64, 6: 65+)</TableCell>
                    <TableCell>3</TableCell>
                    <TableCell>Yes</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">ethnicity</TableCell>
                    <TableCell>string</TableCell>
                    <TableCell>Ethnicity of the user</TableCell>
                    <TableCell>Hispanic/Latino</TableCell>
                    <TableCell>Yes</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">use_case_id</TableCell>
                    <TableCell>string</TableCell>
                    <TableCell>Type of voucher (A1: % off, B1: $ off, C1: free item)</TableCell>
                    <TableCell>B1</TableCell>
                    <TableCell>Yes</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">provider_id</TableCell>
                    <TableCell>string</TableCell>
                    <TableCell>ID of the provider who validated the voucher</TableCell>
                    <TableCell>P20001</TableCell>
                    <TableCell>Yes</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">provider_location</TableCell>
                    <TableCell>string</TableCell>
                    <TableCell>Location of the provider where redemption occurred</TableCell>
                    <TableCell>Downtown Branch</TableCell>
                    <TableCell>No</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">value_redeemed</TableCell>
                    <TableCell>decimal</TableCell>
                    <TableCell>Monetary value of the voucher that was redeemed</TableCell>
                    <TableCell>25.00</TableCell>
                    <TableCell>No</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Available Reports</CardTitle>
              <CardDescription>
                Standard reports that can be generated from redemption data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold">Redemption Summary Report</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Overview of all voucher redemptions by date range
                      </p>
                    </div>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      <span>Export</span>
                    </Button>
                  </div>
                  <ul className="list-disc pl-5 text-sm space-y-2 text-gray-600">
                    <li>Total redemptions by date range</li>
                    <li>Breakdown by voucher type</li>
                    <li>Value of redemptions</li>
                    <li>Geographic distribution of redemptions</li>
                  </ul>
                </Card>

                <Card className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold">Demographic Analysis</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Demographic breakdown of voucher redemptions
                      </p>
                    </div>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      <span>Export</span>
                    </Button>
                  </div>
                  <ul className="list-disc pl-5 text-sm space-y-2 text-gray-600">
                    <li>Redemptions by age group</li>
                    <li>Redemptions by gender</li>
                    <li>Redemptions by ethnicity</li>
                    <li>Cross-tabulation of demographics</li>
                  </ul>
                </Card>

                <Card className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold">Provider Performance</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Analysis of voucher redemptions by provider
                      </p>
                    </div>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      <span>Export</span>
                    </Button>
                  </div>
                  <ul className="list-disc pl-5 text-sm space-y-2 text-gray-600">
                    <li>Redemption counts by provider</li>
                    <li>Value of redemptions by provider</li>
                    <li>Provider location analysis</li>
                    <li>Provider redemption trends</li>
                  </ul>
                </Card>

                <Card className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold">Event Effectiveness</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Analysis of voucher redemptions by originating event
                      </p>
                    </div>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      <span>Export</span>
                    </Button>
                  </div>
                  <ul className="list-disc pl-5 text-sm space-y-2 text-gray-600">
                    <li>Redemption rates by event</li>
                    <li>Time-to-redemption analysis</li>
                    <li>Event ROI calculations</li>
                    <li>Comparative event performance</li>
                  </ul>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-bold text-blue-800 mb-2">Implementation Recommendations</h3>
        <p className="text-blue-700 mb-4">
          Based on the requirements, here are the recommended approaches for tracking voucher redemptions:
        </p>
        <ul className="list-disc pl-5 space-y-3 text-blue-700">
          <li>
            <strong>Database Storage:</strong> Store all redemption data in a dedicated database table. This enables real-time 
            reporting and analysis. Use the schema shown above.
          </li>
          <li>
            <strong>Report Generation:</strong> Provide downloadable reports in CSV and PDF formats for offline analysis. 
            These can be generated on-demand or scheduled automatically.
          </li>
          <li>
            <strong>Data Capture:</strong> When a provider scans a voucher, all the required information should be captured 
            automatically from the QR code and user profile.
          </li>
          <li>
            <strong>Analytics Dashboard:</strong> Provide a real-time analytics dashboard that visualizes redemption data 
            across different dimensions (demographics, geography, time).
          </li>
        </ul>
      </div>
    </DashboardLayout>
  );
};

export default DatabaseSchemaView;
