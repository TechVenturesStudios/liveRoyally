
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
              <TableHead className="w-[200px]">Column Name</TableHead>
              <TableHead className="w-[120px]">Data Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[150px]">Example Value</TableHead>
              <TableHead className="w-[100px] text-center">Required</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schemaFields.map((field, index) => (
              <TableRow key={index} className="bg-blue-50">
                <TableCell className="font-medium">{field.name}</TableCell>
                <TableCell>{field.dataType}</TableCell>
                <TableCell>{field.description}</TableCell>
                <TableCell>{field.example}</TableCell>
                <TableCell className="text-center">{field.required ? "Yes" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SchemaTable;
