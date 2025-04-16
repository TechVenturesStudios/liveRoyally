
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUp, ArrowDown, Medal } from "lucide-react";

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

interface HistoricalEventsTabProps {
  events: Event[];
  sortOrder: "asc" | "desc";
  toggleSortOrder: () => void;
}

const HistoricalEventsTab = ({ events, sortOrder, toggleSortOrder }: HistoricalEventsTabProps) => {
  const historicalEvents = events.filter(event => event.status === "completed" && event.participated);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Historical Events</CardTitle>
          <CardDescription>Events you've participated in</CardDescription>
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
                <TableHead>Location</TableHead>
                <TableHead>Organizer</TableHead>
                <TableHead>Network Points Earned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historicalEvents.length > 0 ? historicalEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>{event.date}</TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>{event.organizer}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Medal className="h-4 w-4 text-royal" />
                      <span className="font-medium">{event.networkScore}</span>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                    No historical events found
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

export default HistoricalEventsTab;
