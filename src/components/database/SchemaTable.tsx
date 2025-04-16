
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const SchemaTable = () => {
  return (
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
            <TableRow className="bg-blue-50">
              <TableCell className="font-medium">Unique User ID's</TableCell>
              <TableCell>string</TableCell>
              <TableCell>Unique identifier of the member</TableCell>
              <TableCell>30001</TableCell>
              <TableCell>Yes</TableCell>
            </TableRow>
            <TableRow className="bg-blue-50">
              <TableCell className="font-medium">Network ID</TableCell>
              <TableCell>string</TableCell>
              <TableCell>Network identifier (e.g., royal)</TableCell>
              <TableCell>royal</TableCell>
              <TableCell>Yes</TableCell>
            </TableRow>
            <TableRow className="bg-blue-50">
              <TableCell className="font-medium">Event ID</TableCell>
              <TableCell>string</TableCell>
              <TableCell>Identifier for the event where voucher was distributed</TableCell>
              <TableCell>EV0001</TableCell>
              <TableCell>Yes</TableCell>
            </TableRow>
            <TableRow className="bg-blue-50">
              <TableCell className="font-medium">Voucher ID</TableCell>
              <TableCell>string</TableCell>
              <TableCell>Unique identifier for the voucher</TableCell>
              <TableCell>VC12345</TableCell>
              <TableCell>Yes</TableCell>
            </TableRow>
            <TableRow className="bg-blue-50">
              <TableCell className="font-medium">Date of Record</TableCell>
              <TableCell>timestamp</TableCell>
              <TableCell>Date and time when the voucher was redeemed</TableCell>
              <TableCell>2025-04-16T14:32:21Z</TableCell>
              <TableCell>Yes</TableCell>
            </TableRow>
            <TableRow className="bg-blue-50">
              <TableCell className="font-medium">Zip Code (of User ID)</TableCell>
              <TableCell>string</TableCell>
              <TableCell>Zip code of the user</TableCell>
              <TableCell>90210</TableCell>
              <TableCell>Yes</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SchemaTable;
