import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUp, ArrowDown, CalendarDays, CheckCircle2 } from "lucide-react";
import ViewToggle from "@/components/ui/ViewToggle";
import PointsCircle from "@/components/ui/PointsCircle";
import EventDetailDialog from "@/components/ui/EventDetailDialog";

const mockUpcomingApproved = [
  {
    id: "UPE001",
    title: "Summer Market Festival",
    description: "A vibrant market showcasing local businesses",
    partner: "City Community Foundation",
    date: "2025-07-15",
    time: "10:00 AM - 4:00 PM",
    location: "Downtown Plaza",
    networkPoints: 200,
    approvedDate: "2025-05-20",
    goLiveDate: "2025-06-15",
  },
  {
    id: "UPE002",
    title: "Health & Wellness Expo",
    description: "Promote health services to the community",
    partner: "Downtown Business Alliance",
    date: "2025-08-05",
    time: "9:00 AM - 2:00 PM",
    location: "Community Center",
    networkPoints: 175,
    approvedDate: "2025-06-01",
    goLiveDate: "2025-07-01",
  },
  {
    id: "UPE003",
    title: "Back to School Drive",
    description: "Support local families with school supplies",
    partner: "Jones Event Planning",
    date: "2025-08-20",
    time: "11:00 AM - 5:00 PM",
    location: "Central Park",
    networkPoints: 250,
    approvedDate: "2025-06-10",
    goLiveDate: "2025-07-20",
  },
];

const ProviderUpcomingEventsPage = () => {
  const [events, setEvents] = useState(mockUpcomingApproved);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedEvent, setSelectedEvent] = useState<typeof mockUpcomingApproved[0] | null>(null);

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    setEvents(prev =>
      [...prev].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return newOrder === "asc" ? dateA - dateB : dateB - dateA;
      })
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-2 sm:space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="font-barlow font-bold text-xl sm:text-3xl text-foreground">Upcoming Events</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Approved events not yet live</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">{events.length} upcoming</span>
            </div>
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={toggleSortOrder} className="flex items-center gap-0.5 text-[10px] sm:text-xs h-6 sm:h-8 px-2">
            <span>Date</span>
            {sortOrder === "asc" ? <ArrowUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <ArrowDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
          </Button>
        </div>

        {events.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {events.map((event) => (
                <Card key={event.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base font-semibold truncate">{event.title}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">{event.description}</CardDescription>
                      </div>
                      <PointsCircle points={event.networkPoints} />
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Location</span>
                        <span className="text-foreground">{event.location}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Date</span>
                        <span className="text-foreground">{event.date}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Time</span>
                        <span className="text-foreground">{event.time}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Partner</span>
                        <span className="text-foreground">{event.partner}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs font-medium text-foreground/60 uppercase tracking-wide">Status</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <div>Approved: {event.approvedDate}</div>
                      <div>Go Live: {event.goLiveDate}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px]">Event</TableHead>
                        <TableHead className="text-[11px]">Location</TableHead>
                        <TableHead className="text-[11px]">Date</TableHead>
                        <TableHead className="text-[11px]">Time</TableHead>
                        <TableHead className="text-[11px]">Partner</TableHead>
                        <TableHead className="text-[11px]">Status</TableHead>
                        <TableHead className="text-[11px] w-[44px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedEvent(event)}>
                          <TableCell className="py-2">
                            <div className="font-medium text-xs">{event.title}</div>
                            <div className="text-[11px] text-muted-foreground line-clamp-1">{event.description}</div>
                          </TableCell>
                          <TableCell className="text-xs py-2">{event.location}</TableCell>
                          <TableCell className="text-xs py-2 whitespace-nowrap">{event.date}</TableCell>
                          <TableCell className="text-xs py-2 whitespace-nowrap">{event.time}</TableCell>
                          <TableCell className="text-xs py-2">{event.partner}</TableCell>
                          <TableCell className="py-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0">
                              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Approved
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2"><PointsCircle points={event.networkPoints} size="sm" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No upcoming approved events
            </CardContent>
          </Card>
        )}
      </div>

      {selectedEvent && (
        <EventDetailDialog
          open={!!selectedEvent}
          onOpenChange={(open) => !open && setSelectedEvent(null)}
          title={selectedEvent.title}
          description={selectedEvent.description}
          points={selectedEvent.networkPoints}
          rows={[
            { label: "Partner", value: selectedEvent.partner },
            { label: "Location", value: selectedEvent.location },
            { label: "Date", value: selectedEvent.date },
            { label: "Time", value: selectedEvent.time },
            { label: "Approved Date", value: selectedEvent.approvedDate },
            { label: "Go Live Date", value: selectedEvent.goLiveDate },
            { label: "Status", value: <Badge variant="outline" className="bg-blue-50 text-blue-700"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge> },
          ]}
        />
      )}
    </DashboardLayout>
  );
};

export default ProviderUpcomingEventsPage;
