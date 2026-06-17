import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Calendar, Users, Send, ArrowUpDown, CalendarDays, Tag, CheckCircle2, Search, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { createEvent } from "@/api/events";
import { fetchPartnerDashboardEvents, type PartnerDashboardEvent } from "@/api/partnerEvents";
import { fetchPartnerProviders, PartnerProvider } from "@/api/myProviders";
import { getUserFromStorage } from "@/utils/userStorage";

const CampaignManagementTab = () => {
  const { toast } = useToast();
  const [showCreateEventDialog, setShowCreateEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PartnerDashboardEvent | null>(null);
  const [events, setEvents] = useState<PartnerDashboardEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState("");

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    endDate: "",
    time: "",
    location: "",
    networkPoints: "",
    deadline: "",
  });

  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<string>("businessName");
  const [sortAsc, setSortAsc] = useState(true);
  const [providerSearch, setProviderSearch] = useState("");
  const [providers, setProviders] = useState<PartnerProvider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState("");
  const [submittingEvent, setSubmittingEvent] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      setEventsLoading(true);
      setEventsError("");
      const loadedEvents = await fetchPartnerDashboardEvents(getUserFromStorage()?.cognitoId);
      setEvents(loadedEvents);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load partner events";
      setEventsError(message);
      toast({ title: "Could not load events", description: message, variant: "destructive" });
    } finally {
      setEventsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!showCreateEventDialog) return;

    let isMounted = true;

    const loadProviders = async () => {
      try {
        setProvidersLoading(true);
        setProvidersError("");
        const user = getUserFromStorage();
        const loadedProviders = await fetchPartnerProviders(user?.cognitoId);
        if (isMounted) {
          setProviders(loadedProviders);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load providers";
        if (isMounted) {
          setProvidersError(message);
          toast({ title: "Could not load providers", description: message, variant: "destructive" });
        }
      } finally {
        if (isMounted) {
          setProvidersLoading(false);
        }
      }
    };

    void loadProviders();

    return () => {
      isMounted = false;
    };
  }, [showCreateEventDialog, toast]);

  const loadCurrentUserId = () => getUserFromStorage()?.id;

  const handleEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEventForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProviderToggle = (providerId: string) => {
    setSelectedProviders((prev) =>
      prev.includes(providerId) ? prev.filter((id) => id !== providerId) : [...prev, providerId]
    );
  };

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sortedProviders = useMemo(() => {
    let filtered = [...providers];
    if (providerSearch.trim()) {
      const q = providerSearch.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.businessName.toLowerCase().includes(q) ||
          p.businessCategory.toLowerCase().includes(q) ||
          p.businessCity.toLowerCase().includes(q) ||
          `${p.agentFirstName} ${p.agentLastName}`.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => {
      const aVal = (a as any)[sortKey] ?? "";
      const bVal = (b as any)[sortKey] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortAsc ? cmp : -cmp;
    });
  }, [providers, sortKey, sortAsc, providerSearch]);

  const approvalEvents = useMemo(
    () => events.filter((event) => event.stage === "needs_approval"),
    [events]
  );
  const upcomingEvents = useMemo(
    () => events.filter((event) => event.stage === "upcoming"),
    [events]
  );
  const pastEvents = useMemo(
    () => events.filter((event) => event.stage === "past"),
    [events]
  );

  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.date || !eventForm.endDate || !eventForm.location || selectedProviders.length === 0) {
      toast({
        title: "Missing Fields",
        description: "Please fill all required fields, including the end date, and select at least one provider.",
        variant: "destructive",
      });
      return;
    }

    const partnerId = loadCurrentUserId();
    if (!partnerId) {
      toast({ title: "Event creation failed", description: "Could not find the current partner.", variant: "destructive" });
      return;
    }

    try {
      setSubmittingEvent(true);
      const result = await createEvent({
        partnerId,
        title: eventForm.title,
        description: eventForm.description,
        startDate: eventForm.date,
        endDate: eventForm.endDate,
        location: eventForm.location,
        eventTime: eventForm.time,
        networkPoints: eventForm.networkPoints,
        responseDeadline: eventForm.deadline,
        providerIds: selectedProviders,
      });

      toast({
        title: "Event Created & Sent",
        description: `"${eventForm.title}" (${result.eventId}) has been sent to ${selectedProviders.length} provider(s) for approval.`,
      });

      setEventForm({ title: "", description: "", date: "", endDate: "", time: "", location: "", networkPoints: "", deadline: "" });
      setSelectedProviders([]);
      setProviderSearch("");
      setShowCreateEventDialog(false);
      await loadEvents();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create event";
      toast({ title: "Event creation failed", description: message, variant: "destructive" });
    } finally {
      setSubmittingEvent(false);
    }
  };

  const filledSteps = [eventForm.title && eventForm.date && eventForm.endDate && eventForm.location, true, selectedProviders.length > 0].filter(Boolean).length;
  const progressPercent = Math.round((filledSteps / 3) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-barlow font-bold">Event Info</h2>
          <p className="text-xs text-muted-foreground">Real events created by this partner</p>
        </div>
        <Dialog open={showCreateEventDialog} onOpenChange={setShowCreateEventDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
              <PlusCircle className="h-3.5 w-3.5" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[85vh] p-0">
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle>Create Event</DialogTitle>
              <DialogDescription>Create an event and send it to providers for approval.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(85vh-130px)] px-6 pb-2">
              <div className="space-y-6 pr-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="font-medium">{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-1.5" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Event Details
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="evt-title">Event Title *</Label>
                    <Input id="evt-title" name="title" value={eventForm.title} onChange={handleEventChange} placeholder="e.g. Summer Market Festival" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="evt-desc">Description</Label>
                    <Textarea id="evt-desc" name="description" value={eventForm.description} onChange={handleEventChange} placeholder="What is this event about..." rows={2} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="evt-date">Start Date *</Label>
                      <Input id="evt-date" name="date" type="date" value={eventForm.date} onChange={handleEventChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="evt-endDate">End Date *</Label>
                      <Input id="evt-endDate" name="endDate" type="date" value={eventForm.endDate} onChange={handleEventChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="evt-time">Time</Label>
                      <Input id="evt-time" name="time" value={eventForm.time} onChange={handleEventChange} placeholder="e.g. 10:00 AM - 4:00 PM" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="evt-location">Location *</Label>
                      <Input id="evt-location" name="location" value={eventForm.location} onChange={handleEventChange} placeholder="e.g. Downtown Plaza" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="evt-points">Network Points</Label>
                      <Input id="evt-points" name="networkPoints" type="number" value={eventForm.networkPoints} onChange={handleEventChange} placeholder="e.g. 200" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="evt-deadline">Provider Response Deadline</Label>
                      <Input id="evt-deadline" name="deadline" type="date" value={eventForm.deadline} onChange={handleEventChange} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
                    <Tag className="h-4 w-4 text-primary" />
                    Select Providers
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search providers..." value={providerSearch} onChange={(e) => setProviderSearch(e.target.value)} className="pl-9 h-8 text-sm" />
                    </div>
                    {selectedProviders.length > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {selectedProviders.length} selected
                      </div>
                    )}
                  </div>

                  <div className="hidden md:block rounded-lg border overflow-hidden max-h-[240px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          {[{ key: "businessName", label: "Business" }, { key: "businessCategory", label: "Category" }, { key: "businessCity", label: "City" }].map((col) => (
                            <TableHead key={col.key} className="cursor-pointer select-none hover:text-foreground text-xs" onClick={() => handleSort(col.key)}>
                              <span className="inline-flex items-center gap-1">{col.label}<ArrowUpDown className={`h-3 w-3 ${sortKey === col.key ? "text-primary" : "text-muted-foreground"}`} /></span>
                            </TableHead>
                          ))}
                          <TableHead className="text-right text-xs">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {providersLoading ? (
                          <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground text-xs">Loading providers...</TableCell></TableRow>
                        ) : providersError ? (
                          <TableRow><TableCell colSpan={4} className="text-center py-4 text-destructive text-xs">{providersError}</TableCell></TableRow>
                        ) : sortedProviders.length === 0 ? (
                          <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground text-xs">{providerSearch ? "No providers found." : "No providers in your network yet."}</TableCell></TableRow>
                        ) : sortedProviders.map((provider) => {
                          const isSelected = selectedProviders.includes(provider.id);
                          return (
                            <TableRow key={provider.id} className={isSelected ? "bg-primary/5" : ""}>
                              <TableCell className="font-medium text-xs py-1.5">{provider.businessName}</TableCell>
                              <TableCell className="text-xs py-1.5">{provider.businessCategory}</TableCell>
                              <TableCell className="text-xs py-1.5">{provider.businessCity}</TableCell>
                              <TableCell className="text-right py-1.5">
                                <Button type="button" size="sm" variant={isSelected ? "outline" : "default"} className={`h-6 text-[11px] px-2 ${isSelected ? "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" : "bg-green-600 hover:bg-green-700 text-white"}`} onClick={() => handleProviderToggle(provider.id)}>
                                  {isSelected ? "Remove" : "Select"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="md:hidden space-y-2 max-h-[240px] overflow-y-auto">
                    {providersLoading ? (
                      <p className="text-center py-4 text-muted-foreground text-xs">Loading providers...</p>
                    ) : providersError ? (
                      <p className="text-center py-4 text-destructive text-xs">{providersError}</p>
                    ) : sortedProviders.length === 0 ? (
                      <p className="text-center py-4 text-muted-foreground text-xs">{providerSearch ? "No providers found." : "No providers in your network yet."}</p>
                    ) : sortedProviders.map((provider) => {
                      const isSelected = selectedProviders.includes(provider.id);
                      return (
                        <div key={provider.id} className={`rounded-lg border p-2.5 ${isSelected ? "border-primary bg-primary/5" : ""}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-xs truncate">{provider.businessName}</p>
                              <p className="text-[11px] text-muted-foreground">{provider.businessCategory} • {provider.businessCity}</p>
                            </div>
                            <Button type="button" size="sm" variant={isSelected ? "outline" : "default"} className={`shrink-0 h-6 text-[11px] px-2 ${isSelected ? "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" : "bg-green-600 hover:bg-green-700 text-white"}`} onClick={() => handleProviderToggle(provider.id)}>
                              {isSelected ? "Remove" : "Select"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="px-6 py-4 border-t">
              <div className="flex items-center justify-between w-full gap-3">
                <span className="text-xs text-muted-foreground">
                  {selectedProviders.length === 0 ? "Select at least one provider" : `${selectedProviders.length} provider(s) selected`}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowCreateEventDialog(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleCreateEvent} disabled={submittingEvent || !eventForm.title || !eventForm.date || !eventForm.endDate || !eventForm.location || selectedProviders.length === 0}>
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    {submittingEvent ? "Creating..." : "Send to Providers"}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {eventsLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">Loading events...</CardContent>
        </Card>
      ) : (
        <>
          {eventsError && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="py-4 text-sm text-destructive">{eventsError}</CardContent>
            </Card>
          )}

          {approvalEvents.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-amber-100">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <CardTitle className="text-sm">Needs Approval</CardTitle>
                  <Badge variant="secondary" className="text-xs ml-auto bg-amber-100 text-amber-800">{approvalEvents.length}</Badge>
                </div>
                <CardDescription className="text-xs">Events with pending provider invites for this partner</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  {approvalEvents.map((evt) => (
                    <div key={evt.id} className="border rounded-lg p-3 bg-background cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setSelectedEvent(evt)}>
                      <div className="flex justify-between items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm">{evt.title}</h3>
                        <Badge className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0 shrink-0">{evt.pendingProviderCount} pending</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                        <span>{evt.providerCount} invite(s)</span>
                        <span>{evt.date ? new Date(evt.date).toLocaleDateString() : "TBD"}</span>
                        <span>Deadline: {evt.responseDeadline || "TBD"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-blue-100">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <CardTitle className="text-sm">Upcoming Events</CardTitle>
                  <Badge variant="secondary" className="text-xs ml-auto">{upcomingEvents.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ScrollArea className="h-[220px]">
                  <div className="space-y-2 pr-2">
                    {upcomingEvents.length > 0 ? upcomingEvents.map((evt) => (
                      <div key={evt.id} className="border rounded-lg p-2.5">
                        <div className="flex justify-between items-center gap-2 mb-1">
                          <h3 className="font-medium text-xs truncate">{evt.title}</h3>
                          <Badge className="bg-blue-100 text-blue-800 shrink-0 text-[10px] px-1.5 py-0">Upcoming</Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground mb-1">{evt.date ? new Date(evt.date).toLocaleDateString() : "TBD"}</div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{evt.acceptedProviderCount} approved, {evt.pendingProviderCount} pending</span>
                        </div>
                      </div>
                    )) : (
                      <p className="text-center py-6 text-muted-foreground text-xs">No upcoming events</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-muted">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-sm">Past Events</CardTitle>
                  <Badge variant="secondary" className="text-xs ml-auto">{pastEvents.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ScrollArea className="h-[220px]">
                  <div className="space-y-2 pr-2">
                    {pastEvents.length > 0 ? pastEvents.map((evt) => (
                      <div key={evt.id} className="border rounded-lg p-2.5">
                        <div className="flex justify-between items-center gap-2 mb-1">
                          <h3 className="font-medium text-xs truncate">{evt.title}</h3>
                          <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">Completed</Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground mb-1">{evt.date ? new Date(evt.date).toLocaleDateString() : "TBD"}</div>
                        <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{evt.acceptedProviderCount} approved providers</span>
                          <span>{evt.networkPoints} points</span>
                          <span>{evt.providerCount} total invites</span>
                        </div>
                      </div>
                    )) : (
                      <p className="text-center py-6 text-muted-foreground text-xs">No past events</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-[520px] max-h-[85vh]">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">{selectedEvent.title}</DialogTitle>
                <DialogDescription className="text-xs">Event details and invite statuses</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-3 pr-3">
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Event Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-xs text-muted-foreground block">Date</span><span className="font-medium text-xs">{selectedEvent.date || "TBD"}</span></div>
                      <div><span className="text-xs text-muted-foreground block">Location</span><span className="font-medium text-xs">{selectedEvent.location || "TBD"}</span></div>
                      <div><span className="text-xs text-muted-foreground block">Created</span><span className="font-medium text-xs">{selectedEvent.createdDate || "TBD"}</span></div>
                      <div><span className="text-xs text-muted-foreground block">Deadline</span><span className="font-medium text-xs">{selectedEvent.responseDeadline || "TBD"}</span></div>
                      <div><span className="text-xs text-muted-foreground block">Stage</span><span className="font-medium text-xs capitalize">{selectedEvent.stage.replace("_", " ")}</span></div>
                      <div><span className="text-xs text-muted-foreground block">Invites</span><span className="font-medium text-xs">{selectedEvent.providerCount}</span></div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-primary">Provider Invites</h4>
                    <div className="space-y-2">
                      {selectedEvent.providers.map((provider) => (
                        <div key={provider.inviteId} className="flex items-center justify-between gap-2 text-sm">
                          <div className="min-w-0">
                            <p className="font-medium text-xs truncate">{provider.providerName}</p>
                            <p className="text-[11px] text-muted-foreground">{provider.providerCategory}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">{provider.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground">
                    {selectedEvent.pendingProviderCount} pending, {selectedEvent.acceptedProviderCount} accepted, {selectedEvent.declinedProviderCount} declined
                  </p>
                </div>
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setSelectedEvent(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignManagementTab;
