import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUp, ArrowDown, Clock, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ViewToggle from "@/components/ui/ViewToggle";
import PointsCircle from "@/components/ui/PointsCircle";
import EventDetailDialog from "@/components/ui/EventDetailDialog";

const mockPartnerPending = [
  {
    id: "BPE001",
    title: "Community Spring Festival",
    description: "Annual celebration of local arts and crafts",
    date: "2025-06-15",
    time: "10:00 AM - 4:00 PM",
    location: "City Park",
    networkPoints: 150,
    providers: [
      { name: "Smith's Merchandise", status: "pending" },
      { name: "Johnson Cafe", status: "pending" },
    ],
    createdDate: "2025-04-10",
  },
  {
    id: "BPE002",
    title: "Tech Innovation Showcase",
    description: "Featuring the latest in local tech startups",
    date: "2025-08-10",
    time: "10:00 AM - 3:00 PM",
    location: "Tech Hub",
    networkPoints: 200,
    providers: [
      { name: "Williams Fitness", status: "pending" },
      { name: "Smith's Merchandise", status: "approved" },
    ],
    createdDate: "2025-05-01",
  },
  {
    id: "BPE003",
    title: "Holiday Market 2025",
    description: "Special holiday promotion event",
    date: "2025-12-10",
    time: "12:00 PM - 8:00 PM",
    location: "Shopping District",
    networkPoints: 225,
    providers: [
      { name: "Johnson Cafe", status: "pending" },
      { name: "Williams Fitness", status: "pending" },
      { name: "Smith's Merchandise", status: "pending" },
    ],
    createdDate: "2025-06-15",
  },
];

const PartnerPendingEventsPage = () => {
  const [events, setEvents] = useState(mockPartnerPending);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedEvent, setSelectedEvent] = useState<typeof mockPartnerPending[0] | null>(null);
  const navigate = useNavigate();

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

  const getProviderStatusBadge = (status: string) => {
    if (status === "approved") {
      return <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">Approved</Badge>;
    }
    return <Badge variant="outline" className="bg-amber-50 text-amber-700 text-xs">Pending</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-2 sm:space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="font-barlow font-bold text-xl sm:text-3xl text-foreground">Pending Events</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Awaiting provider approval</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={() => navigate("/dashboard/create-event")} className="bg-primary hover:bg-primary/90 h-8 px-2 sm:px-3" size="sm">
              <Send className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Create Event</span>
            </Button>
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
                  <CardContent className="flex-1 space-y-3 text-sm">
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
                        <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Created</span>
                        <span className="text-foreground">{event.createdDate}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t space-y-1">
                      <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Providers</span>
                      {event.providers.map((p, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm text-foreground">{p.name}</span>
                          {getProviderStatusBadge(p.status)}
                        </div>
                      ))}
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
                        <TableHead className="text-[11px]">Created</TableHead>
                        <TableHead className="text-[11px]">Providers</TableHead>
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
                          <TableCell className="text-xs py-2 whitespace-nowrap">{event.createdDate}</TableCell>
                          <TableCell className="py-2">
                            <div className="space-y-0.5">
                              {event.providers.map((p, i) => (
                                <div key={i} className="flex items-center gap-1">
                                  <span className="text-[11px]">{p.name}</span>
                                  {getProviderStatusBadge(p.status)}
                                </div>
                              ))}
                            </div>
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
              No pending events
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
            { label: "Created", value: selectedEvent.createdDate },
            {
              label: "Providers",
              value: (
                <div className="space-y-1">
                  {selectedEvent.providers.map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm">{p.name}</span>
                      {getProviderStatusBadge(p.status)}
                    </div>
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

export default PartnerPendingEventsPage;
