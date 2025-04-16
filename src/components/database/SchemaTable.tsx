
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// Define the schema data structure
interface SchemaField {
  name: string;
  dataType: string;
  description: string;
  example: string;
  required: boolean;
}

const schemaFields: SchemaField[] = [
  {
    name: "Unique User ID's",
    dataType: "string",
    description: "Unique identifier of the member",
    example: "30001",
    required: true,
  },
  {
    name: "Network ID",
    dataType: "string",
    description: "Network identifier (e.g., royal)",
    example: "royal",
    required: true,
  },
  {
    name: "Event ID",
    dataType: "string",
    description: "Identifier for the event where voucher was distributed",
    example: "EV0001",
    required: true,
  },
  {
    name: "Voucher ID",
    dataType: "string",
    description: "Unique identifier for the voucher",
    example: "VC12345",
    required: true,
  },
  {
    name: "Date of Record",
    dataType: "timestamp",
    description: "Date and time when the voucher was redeemed",
    example: "2025-04-16T14:32:21Z",
    required: true,
  },
  {
    name: "Zip Code (of User ID)",
    dataType: "string",
    description: "Zip code of the user",
    example: "90210",
    required: true,
  },
];

// Sample user data for demonstration
const sampleUsers = [
  {
    userId: "30001",
    networkId: "royal",
    eventId: "EV0001",
    voucherId: "VC12345",
    dateOfRecord: "2025-04-16T14:32:21Z",
    zipCode: "90210",
  },
  {
    userId: "30002",
    networkId: "royal",
    eventId: "EV0002",
    voucherId: "VC12346",
    dateOfRecord: "2025-04-15T10:15:30Z",
    zipCode: "90211",
  },
  {
    userId: "30003",
    networkId: "premium",
    eventId: "EV0003",
    voucherId: "VC12347",
    dateOfRecord: "2025-04-14T09:45:12Z",
    zipCode: "90212",
  },
];

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
              <TableHead className="w-[120px]">Unique User ID's</TableHead>
              <TableHead className="w-[120px]">Network ID</TableHead>
              <TableHead className="w-[120px]">Event ID</TableHead>
              <TableHead className="w-[120px]">Voucher ID</TableHead>
              <TableHead className="w-[180px]">Date of Record</TableHead>
              <TableHead className="w-[120px]">Zip Code</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampleUsers.map((user, index) => (
              <TableRow key={index} className={index % 2 === 0 ? "bg-blue-50" : "bg-white"}>
                <TableCell className="font-medium">{user.userId}</TableCell>
                <TableCell>{user.networkId}</TableCell>
                <TableCell>{user.eventId}</TableCell>
                <TableCell>{user.voucherId}</TableCell>
                <TableCell>{user.dateOfRecord}</TableCell>
                <TableCell>{user.zipCode}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SchemaTable;
