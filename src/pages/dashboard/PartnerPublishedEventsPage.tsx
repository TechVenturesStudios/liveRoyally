import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUp, ArrowDown, CalendarDays, CheckCircle, History } from "lucide-react";
import ViewToggle from "@/components/ui/ViewToggle";
import PointsCircle from "@/components/ui/PointsCircle";
import EventDetailDialog from "@/components/ui/EventDetailDialog";

const mockPublishedEvents = [
  {
    id: "PUB001",
    title: "Summer Market Festival",
    description: "A vibrant market showcasing local businesses",
    date: "2025-07-15",
    time: "10:00 AM - 4:00 PM",
    location: "Downtown Plaza",
    networkPoints: 200,
    status: "active",
    providers: ["Smith's Merchandise", "Johnson Cafe"],
    participantCount: 45,
  },
  {
    id: "PUB002",
    title: "Health & Wellness Expo",
    description: "Promote health services to the community",
    date: "2025-09-05",
    time: "9:00 AM - 2:00 PM",
    location: "Community Center",
    networkPoints: 175,
    status: "future",
    providers: ["Williams Fitness"],
    participantCount: 0,
  },
  {
    id: "PUB003",
    title: "Back to School Drive",
    description: "Support local families with school supplies",
    date: "2025-10-20",
    time: "11:00 AM - 5:00 PM",
    location: "Central Park",
    networkPoints: 250,
    status: "future",
    providers: ["Smith's Merchandise", "Williams Fitness"],
    participantCount: 0,
  },
  {
    id: "PUB004",
    title: "Spring Community Fair",
    description: "Annual community gathering with local vendors",
    date: "2025-03-28",
    time: "11:00 AM - 5:00 PM",
    location: "Central Park",
    networkPoints: 175,
    status: "past",
    providers: ["Johnson Cafe", "Smith's Merchandise"],
    participantCount: 120,
  },
  {
    id: "PUB005",
    title: "Winter Charity Gala",
    description: "Fundraising event for local charities",
    date: "2024-12-10",
    time: "6:00 PM - 10:00 PM",
    location: "Grand Ballroom",
    networkPoints: 300,
    status: "past",
    providers: ["Williams Fitness", "Johnson Cafe", "Smith's Merchandise"],
    participantCount: 210,
  },
];

const PartnerPublishedEventsPage = () => {
  const [events, setEvents] = useState(mockPublishedEvents);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [activeFilter, setActiveFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedEvent, setSelectedEvent] = useState<typeof mockPublishedEvents[0] | null>(null);

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

  const getFilteredEvents = () => {
    if (activeFilter === "all") return events;
    return events.filter(e => e.status === activeFilter);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>;
      case "future":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Future</Badge>;
      case "past":
        return <Badge variant="outline" className="bg-muted text-muted-foreground">Past</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredEvents = getFilteredEvents();

  return (
    <DashboardLayout>
      <div className="space-y-2 sm:space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="font-barlow font-bold text-xl sm:text-3xl text-foreground">Published Events</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Events available for member participation</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-100">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">{events.length} published</span>
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

        <div className="flex flex-wrap gap-2">
          {["all", "active", "future", "past"].map(filter => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Button>
          ))}
        </div>

        {filteredEvents.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredEvents.map((event) => (
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
                        <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Participants</span>
                        <span className="text-foreground">{event.participantCount}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs font-medium text-foreground/60 uppercase tracking-wide">Status</span>
                      {getStatusBadge(event.status)}
                    </div>
                    <div className="pt-1">
                      <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide mb-1">Providers</span>
                      <div className="flex flex-wrap gap-1">
                        {event.providers.map((p, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
                        ))}
                      </div>
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
                        <TableHead className="text-[11px]">Providers</TableHead>
                        <TableHead className="text-[11px]">Participants</TableHead>
                        <TableHead className="text-[11px]">Status</TableHead>
                        <TableHead className="text-[11px] w-[44px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents.map((event) => (
                        <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedEvent(event)}>
                          <TableCell className="py-2">
                            <div className="font-medium text-xs">{event.title}</div>
                            <div className="text-[11px] text-muted-foreground line-clamp-1">{event.description}</div>
                          </TableCell>
                          <TableCell className="text-xs py-2">{event.location}</TableCell>
                          <TableCell className="text-xs py-2 whitespace-nowrap">{event.date}</TableCell>
                          <TableCell className="text-xs py-2 whitespace-nowrap">{event.time}</TableCell>
                          <TableCell className="py-2">
                            <div className="flex flex-wrap gap-0.5">
                              {event.providers.map((p, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">{p}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs py-2">{event.participantCount}</TableCell>
                          <TableCell className="py-2">{getStatusBadge(event.status)}</TableCell>
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
              No events found
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
            { label: "Location", value: selectedEvent.location },
            { label: "Date", value: selectedEvent.date },
            { label: "Time", value: selectedEvent.time },
            { label: "Participants", value: String(selectedEvent.participantCount) },
            { label: "Status", value: getStatusBadge(selectedEvent.status) },
            {
              label: "Providers",
              value: (
                <div className="flex flex-wrap gap-1">
                  {selectedEvent.providers.map((p, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
                  ))}
                </div>
              ),
            },
          ]}
        />
      )}
    </DashboardLayout>
  );
};

export default PartnerPublishedEventsPage;
