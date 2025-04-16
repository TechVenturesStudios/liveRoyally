
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUp, ArrowDown, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface UpcomingEventsTabProps {
  events: Event[];
  sortOrder: "asc" | "desc";
  toggleSortOrder: () => void;
}

const UpcomingEventsTab = ({ events, sortOrder, toggleSortOrder }: UpcomingEventsTabProps) => {
  const upcomingEvents = events.filter(event => event.status === "active");
  const { toast } = useToast();

  const handleSignUp = (eventTitle: string) => {
    toast({
      title: "Success",
      description: `You've signed up for ${eventTitle}`,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>New opportunities to participate in the network</CardDescription>
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
                <TableHead>Potential Points</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingEvents.length > 0 ? upcomingEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>{event.date}</TableCell>
                  <TableCell>{event.time}</TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>{event.networkScore}</TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      onClick={() => handleSignUp(event.title)}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Sign Up
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                    No upcoming events found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingEventsTab;
