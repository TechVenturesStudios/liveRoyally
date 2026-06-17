import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUp, ArrowDown, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ViewToggle from "@/components/ui/ViewToggle";
import PointsCircle from "@/components/ui/PointsCircle";
import EventDetailDialog from "@/components/ui/EventDetailDialog";
import { useToast } from "@/hooks/use-toast";
import { fetchPartnerPendingEvents, PartnerPendingEvent } from "@/api/partnerEvents";
import { getUserFromStorage } from "@/utils/userStorage";

const PartnerPendingEventsPage = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<PartnerPendingEvent[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedEvent, setSelectedEvent] = useState<PartnerPendingEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadEvents = async () => {
      try {
        setLoading(true);
        setError("");
        const loadedEvents = await fetchPartnerPendingEvents(getUserFromStorage()?.cognitoId);
        if (isMounted) {
          setEvents(loadedEvents);
        }
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Failed to load pending events";
        if (isMounted) {
          setError(message);
          toast({ title: "Could not load pending events", description: message, variant: "destructive" });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const dateA = new Date(a.date || a.createdDate).getTime();
      const dateB = new Date(b.date || b.createdDate).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
  }, [events, sortOrder]);

  const getProviderStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">Accepted</Badge>;
      case "declined":
        return <Badge variant="outline" className="bg-red-50 text-red-700 text-xs">Declined</Badge>;
      case "expired":
        return <Badge variant="outline" className="bg-slate-100 text-slate-600 text-xs">Expired</Badge>;
      default:
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 text-xs">Pending</Badge>;
    }
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

        {error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="py-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {loading ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">Loading pending events...</CardContent>
          </Card>
        ) : sortedEvents.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedEvents.map((event) => (
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
                          <span className="text-sm text-foreground">{p.providerName}</span>
                          {getProviderStatusBadge(p.status)}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t">
                      <span className="text-xs font-medium text-foreground/60 uppercase tracking-wide">Deadline</span>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 text-xs">Due {event.responseDeadline || "TBD"}</Badge>
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
                      {sortedEvents.map((event) => (
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
                                  <span className="text-[11px]">{p.providerName}</span>
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
            { label: "Deadline", value: selectedEvent.responseDeadline || "TBD" },
            {
              label: "Providers",
              value: (
                <div className="space-y-1">
                  {selectedEvent.providers.map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm">{p.providerName}</span>
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
