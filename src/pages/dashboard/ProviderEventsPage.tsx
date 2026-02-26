import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, Clock, CheckCircle, ArrowUp, ArrowDown } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ViewToggle from "@/components/ui/ViewToggle";
import PointsCircle from "@/components/ui/PointsCircle";
import EventDetailDialog from "@/components/ui/EventDetailDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { mockEvents } from "@/data/providerMockData";

const ProviderEventsPage = () => {
  const isMobile = useIsMobile();
  const [events, setEvents] = useState(mockEvents);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [activeFilter, setActiveFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">(isMobile ? "grid" : "list");
  const [selectedEvent, setSelectedEvent] = useState<typeof mockEvents[0] | null>(null);

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
    if (activeFilter === "pending") return events.filter(e => e.status === "pending");
    if (activeFilter === "active") return events.filter(e => e.status === "active");
    if (activeFilter === "completed") return events.filter(e => e.status === "completed");
    return events;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700">Pending</Badge>;
      case "active":
        return <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-muted text-muted-foreground">Completed</Badge>;
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
            <h1 className="font-barlow font-bold text-xl sm:text-3xl text-foreground">Events Management</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Manage and track your events</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{events.length} events</span>
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
          {["all", "pending", "active", "completed"].map(filter => (
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
                      <PointsCircle points={event.networkScore} />
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
                        <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Organizer</span>
                        <span className="text-foreground">{event.organizer}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs font-medium text-foreground/60 uppercase tracking-wide">Status</span>
                      {getStatusBadge(event.status)}
                    </div>
                    {event.participated && (
                      <div className="flex items-center gap-1.5 text-xs text-green-700">
                        <CheckCircle className="h-3.5 w-3.5" /> Participated
                      </div>
                    )}
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
                        <TableHead className="text-[11px]">Organizer</TableHead>
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
                          <TableCell className="text-xs py-2">{event.organizer}</TableCell>
                          <TableCell className="py-2">{getStatusBadge(event.status)}</TableCell>
                          <TableCell className="py-2"><PointsCircle points={event.networkScore} size="sm" /></TableCell>
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
              No events found for this filter
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
          points={selectedEvent.networkScore}
          rows={[
            { label: "Location", value: selectedEvent.location },
            { label: "Date", value: selectedEvent.date },
            { label: "Time", value: selectedEvent.time },
            { label: "Organizer", value: selectedEvent.organizer },
            { label: "Status", value: getStatusBadge(selectedEvent.status) },
            { label: "Participated", value: selectedEvent.participated ? "Yes" : "No" },
          ]}
        />
      )}
    </DashboardLayout>
  );
};

export default ProviderEventsPage;
