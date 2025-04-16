
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUp, ArrowDown, ScanLine, Ticket } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Event {
  id: string;
  title: string;
  status: string;
  date: string;
  time: string;
  location: string;
  description: string;
  organizer: string;
  participated: boolean;
  networkScore: number;
}

interface PendingEventsTabProps {
  events: Event[];
  sortOrder: "asc" | "desc";
  toggleSortOrder: () => void;
}

const PendingEventsTab = ({ events, sortOrder, toggleSortOrder }: PendingEventsTabProps) => {
  const pendingEvents = events.filter(event => event.status === "pending");
  const navigate = useNavigate();

  const handleGoToVouchers = () => {
    navigate("/dashboard/vouchers");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Pending Events</CardTitle>
          <CardDescription>Events you've accepted to participate in</CardDescription>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleSortOrder}
          className="flex items-center gap-1"
        >
          <span>Date</span>
          {sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Organizer</TableHead>
                <TableHead>Network Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingEvents.length > 0 ? pendingEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>{event.date}</TableCell>
                  <TableCell>{event.time}</TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>{event.organizer}</TableCell>
                  <TableCell>{event.networkScore}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                    No pending events found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-4 flex justify-end">
        <Button 
          onClick={handleGoToVouchers}
          className="flex items-center gap-2"
          variant="outline"
        >
          <ScanLine className="h-4 w-4" />
          <span>Scan Vouchers</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PendingEventsTab;
