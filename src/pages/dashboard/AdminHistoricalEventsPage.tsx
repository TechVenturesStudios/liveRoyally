import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import EventDetailDialog from "@/components/ui/EventDetailDialog";
import ViewToggle from "@/components/ui/ViewToggle";
import { ArrowLeft, Building, Calendar, ChevronDown, Globe } from "lucide-react";
import { fetchAdminHistoricalEvents, AdminHistoricalEvent, AdminHistoricalNetwork } from "@/api/adminHistoricalEvents";

const eventCount = (events: AdminHistoricalEvent[]) => events.length;
const networkEventCount = (network: AdminHistoricalNetwork) => network.partners.reduce((total, partner) => total + eventCount(partner.events), 0);

const AdminHistoricalEventsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/dashboard/admin/profile";
  const [selectedEvent, setSelectedEvent] = useState<AdminHistoricalEvent | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [networks, setNetworks] = useState<AdminHistoricalNetwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminHistoricalEvents().then((data) => { if (!cancelled) setNetworks(data.networks); }).catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load historical events"); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const eventTable = (events: AdminHistoricalEvent[]) => events.length ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="text-[11px]">Event</TableHead><TableHead className="text-[11px]">Date</TableHead><TableHead className="text-[11px]">Location</TableHead><TableHead className="text-[11px]">Attendance</TableHead><TableHead className="text-[11px]">Accepted providers</TableHead><TableHead className="text-[11px]">Revenue</TableHead></TableRow></TableHeader><TableBody>{events.map((event) => <TableRow key={event.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedEvent(event)}><TableCell className="py-2"><div className="font-medium text-xs">{event.title}</div><div className="text-[11px] text-muted-foreground line-clamp-1">{event.description}</div></TableCell><TableCell className="text-xs py-2 whitespace-nowrap">{event.date}</TableCell><TableCell className="text-xs py-2">{event.location}</TableCell><TableCell className="text-xs py-2">{event.membersAttended}/{event.membersInvited}</TableCell><TableCell className="text-xs py-2">{event.acceptedProviderCount}</TableCell><TableCell className="text-xs py-2">${event.revenue.toLocaleString()}</TableCell></TableRow>)}</TableBody></Table></div> : <div className="py-3 text-xs text-muted-foreground">No historical events</div>;
  const totalEvents = networks.reduce((total, network) => total + networkEventCount(network), 0);

  return <DashboardLayout><div className="space-y-6"><Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground -ml-2 h-7 text-xs" onClick={() => navigate(from)}><ArrowLeft className="h-3.5 w-3.5" />{from.includes("analytics") ? "Back to Analytics" : "Back to Home"}</Button><div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"><div><h1 className="font-barlow font-bold text-2xl sm:text-3xl mb-1">Historical Events</h1><p className="text-sm text-muted-foreground">All past events organized by network and partner</p></div><div className="flex items-center gap-3"><div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100"><Calendar className="h-4 w-4 text-amber-600" /><span className="text-sm font-medium text-amber-700">{totalEvents} events</span></div><ViewToggle viewMode={viewMode} onViewChange={setViewMode} /></div></div>{loading ? <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">Loading historical events...</div> : error ? <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-destructive">{error}</div> : networks.length === 0 ? <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">No historical events found.</div> : viewMode === "list" ? <div className="space-y-4">{networks.map((network) => <Collapsible key={network.code}><Card><CollapsibleTrigger className="w-full"><div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"><div className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /><h2 className="font-barlow font-bold text-sm uppercase tracking-wide">{network.name}</h2></div><div className="flex items-center gap-2"><Badge variant="secondary" className="text-[10px]">{networkEventCount(network)} events</Badge><Badge variant="outline" className="text-[10px]">{network.partners.length} partners</Badge><ChevronDown className="h-4 w-4 text-muted-foreground" /></div></div></CollapsibleTrigger><CollapsibleContent><div className="border-t">{network.partners.map((partner) => <Collapsible key={partner.name}><CollapsibleTrigger className="w-full"><div className="flex items-center justify-between px-6 py-2.5 hover:bg-muted/30"><div className="flex items-center gap-2"><Building className="h-3.5 w-3.5 text-muted-foreground" /><span className="font-medium text-xs">{partner.name}</span></div><div className="flex items-center gap-2"><Badge variant="secondary" className="text-[10px]">{eventCount(partner.events)} events</Badge><ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /></div></div></CollapsibleTrigger><CollapsibleContent><div className="bg-muted/20 px-8 pb-2">{eventTable(partner.events)}</div></CollapsibleContent></Collapsible>)}</div></CollapsibleContent></Card></Collapsible>)}</div> : <div className="space-y-8">{networks.map((network) => <div key={network.code}><div className="flex items-center gap-2 mb-4"><Globe className="h-4 w-4 text-primary" /><h2 className="font-barlow font-bold text-base uppercase tracking-wide">{network.name}</h2></div><div className="grid grid-cols-1 xl:grid-cols-2 gap-4">{network.partners.map((partner) => <Card key={partner.name}><CardHeader className="pb-3"><CardTitle className="text-base font-semibold">{partner.name}</CardTitle><Badge variant="secondary" className="w-fit text-[10px]">{eventCount(partner.events)} events</Badge></CardHeader><CardContent className="pt-0">{eventTable(partner.events)}</CardContent></Card>)}</div></div>)}</div>}</div>{selectedEvent && <EventDetailDialog open onOpenChange={() => setSelectedEvent(null)} title={selectedEvent.title} description={selectedEvent.description} rows={[{ label: "Date", value: selectedEvent.date }, { label: "Time", value: selectedEvent.time }, { label: "Location", value: selectedEvent.location }, { label: "Attendance", value: `${selectedEvent.membersAttended} / ${selectedEvent.membersInvited}` }, { label: "Accepted providers", value: String(selectedEvent.acceptedProviderCount) }, { label: "Revenue", value: `$${selectedEvent.revenue.toLocaleString()}` }]} />}</DashboardLayout>;
};

export default AdminHistoricalEventsPage;
