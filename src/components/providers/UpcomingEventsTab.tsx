
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Clock, CalendarCheck } from "lucide-react";

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
  // Approved by partner but start date hasn't arrived yet — not visible to members
  const upcomingEvents = events.filter(event => event.status === "active");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            Upcoming Events
          </CardTitle>
          <CardDescription>
            Partner-approved events awaiting their start date — not yet visible to members
          </CardDescription>
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
                <TableHead>Start Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Status</TableHead>
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
                    <Badge variant="outline" className="text-xs gap-1">
                      <Clock className="h-3 w-3" />
                      Awaiting Start Date
                    </Badge>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No upcoming approved events
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
