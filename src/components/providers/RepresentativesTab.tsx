
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Representative {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
}

interface NetworkMember {
  id: string;
  name: string;
  email: string;
  memberSince: string;
}

interface RepresentativesTabProps {
  representatives: Representative[];
  networkMembers: NetworkMember[];
  onAddRepresentative: (memberId: string) => void;
}

const RepresentativesTab = ({ 
  representatives, 
  networkMembers, 
  onAddRepresentative 
}: RepresentativesTabProps) => {
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const { toast } = useToast();

  const handleAddRepresentative = () => {
    if (!selectedMemberId) {
      toast({
        title: "Error",
        description: "Please select a member to add as a representative",
        variant: "destructive"
      });
      return;
    }

    onAddRepresentative(selectedMemberId);
    setSelectedMemberId("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authorized Representatives</CardTitle>
        <CardDescription>
          Manage who can represent your business at events
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h3 className="text-md font-medium mb-3">Current Representatives</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {representatives.map((rep) => (
                  <TableRow key={rep.id}>
                    <TableCell className="font-medium">{rep.name}</TableCell>
                    <TableCell>{rep.email}</TableCell>
                    <TableCell>{rep.phone}</TableCell>
                    <TableCell>{rep.role}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {rep.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <div className="border-t pt-6">
          <h3 className="text-md font-medium mb-3">Add New Representative</h3>
          <p className="text-sm text-gray-500 mb-4">Select a member from your network to add as an authorized representative</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-3">
              <select 
                className="w-full p-2 border rounded-md"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
              >
                <option value="">Select a member...</option>
                {networkMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={handleAddRepresentative} className="w-full">
              <Users className="mr-2 h-4 w-4" />
              Add Representative
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RepresentativesTab;
