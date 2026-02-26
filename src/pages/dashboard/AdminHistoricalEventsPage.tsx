import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import EventDetailDialog from "@/components/ui/EventDetailDialog";
import ViewToggle from "@/components/ui/ViewToggle";
import { ArrowLeft, ChevronDown, Globe, Building, Users, Calendar, Clock } from "lucide-react";

interface HistoricalEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  membersAttended: number;
  membersInvited: number;
  revenue: number;
}

interface Provider {
  id: string;
  businessName: string;
  businessCategory: string;
  agentName: string;
  participated: boolean;
  events: HistoricalEvent[];
}

interface Partner {
  name: string;
  providers: Provider[];
}

interface Network {
  name: string;
  code: string;
  partners: Partner[];
}

const mockNetworkData: Network[] = [
  {
    name: "Network Alpha",
    code: "ROYAL1",
    partners: [
      {
        name: "City Community Foundation",
        providers: [
          {
            id: "PRV001",
            businessName: "Smith's Merchandise",
            businessCategory: "Retail",
            agentName: "John Smith",
            participated: true,
            events: [
              { id: "HE001", title: "Spring Community Fair", date: "2025-03-28", time: "11:00 AM - 5:00 PM", location: "Central Park", description: "Annual community gathering", membersAttended: 120, membersInvited: 200, revenue: 4500 },
              { id: "HE002", title: "Holiday Shopping Event", date: "2024-12-15", time: "12:00 PM - 8:00 PM", location: "Shopping District", description: "Holiday promotion event", membersAttended: 85, membersInvited: 150, revenue: 6200 },
            ],
          },
          {
            id: "PRV003",
            businessName: "Williams Fitness",
            businessCategory: "Health & Wellness",
            agentName: "Michael Williams",
            participated: true,
            events: [
              { id: "HE003", title: "Wellness Weekend", date: "2025-02-14", time: "9:00 AM - 3:00 PM", location: "Community Center", description: "Health and wellness expo", membersAttended: 95, membersInvited: 130, revenue: 3200 },
            ],
          },
          {
            id: "PRV008",
            businessName: "Turner Hardware",
            businessCategory: "Home & Garden",
            agentName: "Alex Turner",
            participated: false,
            events: [],
          },
        ],
      },
      {
        name: "Heritage Arts Council",
        providers: [
          {
            id: "PRV005",
            businessName: "Lee's Electronics",
            businessCategory: "Retail",
            agentName: "James Lee",
            participated: true,
            events: [
              { id: "HE004", title: "Tech Fair", date: "2025-01-20", time: "10:00 AM - 4:00 PM", location: "Convention Center", description: "Technology showcase", membersAttended: 200, membersInvited: 300, revenue: 8500 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Network Beta",
    code: "METRO1",
    partners: [
      {
        name: "Downtown Business Alliance",
        providers: [
          {
            id: "PRV004",
            businessName: "Garcia Auto",
            businessCategory: "Automotive",
            agentName: "Maria Garcia",
            participated: true,
            events: [
              { id: "HE005", title: "Auto Show", date: "2025-04-10", time: "10:00 AM - 6:00 PM", location: "Expo Center", description: "Annual auto show", membersAttended: 310, membersInvited: 400, revenue: 12000 },
              { id: "HE006", title: "Business Networking Night", date: "2025-03-05", time: "6:00 PM - 9:00 PM", location: "Grand Hotel", description: "Evening networking", membersAttended: 75, membersInvited: 100, revenue: 2800 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Network Gamma",
    code: "WEST1",
    partners: [
      {
        name: "Westside Community Foundation",
        providers: [
          {
            id: "PRV006",
            businessName: "Nguyen Bakery",
            businessCategory: "Food & Beverage",
            agentName: "Linda Nguyen",
            participated: true,
            events: [
              { id: "HE007", title: "Food Festival", date: "2025-05-01", time: "11:00 AM - 7:00 PM", location: "Waterfront Park", description: "Local food festival", membersAttended: 450, membersInvited: 500, revenue: 15000 },
            ],
          },
        ],
      },
      {
        name: "Riverfront Chamber of Commerce",
        providers: [
          {
            id: "PRV007",
            businessName: "Chen Design Studio",
            businessCategory: "Creative Services",
            agentName: "Michael Chen",
            participated: true,
            events: [
              { id: "HE008", title: "Art Walk", date: "2025-02-28", time: "4:00 PM - 9:00 PM", location: "Arts District", description: "Monthly art walk event", membersAttended: 180, membersInvited: 250, revenue: 5600 },
            ],
          },
        ],
      },
    ],
  },
];

const getTotalEvents = (network: Network) =>
  network.partners.reduce((sum, p) => sum + p.providers.reduce((s, prov) => s + prov.events.length, 0), 0);

const getPartnerEventCount = (partner: Partner) =>
  partner.providers.reduce((s, prov) => s + prov.events.length, 0);

const AdminHistoricalEventsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || "/dashboard/admin/profile";
  const backLabel = from.includes("analytics") ? "Back to Analytics" : "Back to Home";
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const totalEvents = mockNetworkData.reduce((sum, n) => sum + getTotalEvents(n), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2 h-7 text-xs"
          onClick={() => navigate(from)}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {backLabel}
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-barlow font-bold text-2xl sm:text-3xl text-foreground mb-1">Historical Events</h1>
            <p className="text-sm text-muted-foreground">All past events organized by network</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
              <Calendar className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">{totalEvents} events</span>
            </div>
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>
        </div>

        {viewMode === "list" ? (
          /* List view - collapsible drill-down */
          <div className="space-y-4">
            {mockNetworkData.map((network) => (
              <Collapsible key={network.code}>
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <h2 className="font-barlow font-bold text-sm uppercase tracking-wide text-foreground">{network.name}</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">{getTotalEvents(network)} events</Badge>
                        <Badge variant="outline" className="text-[10px]">{network.partners.length} partners</Badge>
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t">
                      {network.partners.map((partner) => (
                        <Collapsible key={partner.name}>
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between px-6 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer border-b last:border-b-0">
                              <div className="flex items-center gap-2">
                                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="font-medium text-xs">{partner.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-[10px]">{getPartnerEventCount(partner)} events</Badge>
                                <Badge variant="outline" className="text-[10px]">{partner.providers.length} providers</Badge>
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200" />
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="bg-muted/20">
                              {partner.providers.map((provider) => (
                                <Collapsible key={provider.id}>
                                  <CollapsibleTrigger className="w-full">
                                    <div className="flex items-center justify-between px-8 py-2 hover:bg-muted/40 transition-colors cursor-pointer border-b last:border-b-0">
                                      <div className="flex items-center gap-2">
                                        <Users className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-xs font-medium">{provider.businessName}</span>
                                        <span className="text-[10px] text-muted-foreground">({provider.businessCategory})</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {provider.events.length > 0 ? (
                                          <Badge variant="secondary" className="text-[10px]">{provider.events.length} events</Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-[10px] text-muted-foreground">No events</Badge>
                                        )}
                                        <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform duration-200" />
                                      </div>
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    {provider.events.length > 0 ? (
                                      <div className="px-8 pb-2">
                                        <div className="overflow-x-auto">
                                          <Table>
                                            <TableHeader>
                                              <TableRow>
                                                <TableHead className="text-[11px]">Event</TableHead>
                                                <TableHead className="text-[11px]">Date</TableHead>
                                                <TableHead className="text-[11px]">Location</TableHead>
                                                <TableHead className="text-[11px]">Attendance</TableHead>
                                                <TableHead className="text-[11px]">Revenue</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {provider.events.map((event) => (
                                                <TableRow
                                                  key={event.id}
                                                  className="cursor-pointer hover:bg-muted/50"
                                                  onClick={() => setSelectedEvent(event)}
                                                >
                                                  <TableCell className="py-2">
                                                    <div className="font-medium text-xs">{event.title}</div>
                                                    <div className="text-[11px] text-muted-foreground line-clamp-1">{event.description}</div>
                                                  </TableCell>
                                                  <TableCell className="text-xs py-2 whitespace-nowrap">{event.date}</TableCell>
                                                  <TableCell className="text-xs py-2">{event.location}</TableCell>
                                                  <TableCell className="text-xs py-2">{event.membersAttended}/{event.membersInvited}</TableCell>
                                                  <TableCell className="text-xs py-2">${event.revenue.toLocaleString()}</TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="px-10 py-3 text-xs text-muted-foreground">No historical events</div>
                                    )}
                                  </CollapsibleContent>
                                </Collapsible>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        ) : (
          /* Grid view - partner cards with providers underneath */
          <div className="space-y-8">
            {mockNetworkData.map((network) => (
              <div key={network.code}>
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="h-4 w-4 text-primary" />
                  <h2 className="font-barlow font-bold text-base uppercase tracking-wide text-foreground">{network.name}</h2>
                  <Badge variant="secondary" className="text-[10px] ml-1">{network.partners.length} partners</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {network.partners.map((partner) => (
                    <Card key={partner.name} className="flex flex-col">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-base font-semibold truncate">{partner.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {partner.providers.length} provider{partner.providers.length !== 1 ? "s" : ""} · {getPartnerEventCount(partner)} events
                            </CardDescription>
                          </div>
                          <div className="rounded-full p-2 bg-muted shrink-0">
                            <Building className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 pt-0">
                        <div className="space-y-1.5">
                          <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide mb-2">Providers</span>
                          {partner.providers.map((provider) => (
                            <div
                              key={provider.id}
                              className="flex items-center justify-between p-2 rounded-md hover:bg-muted/60 cursor-pointer transition-colors border border-transparent hover:border-border"
                              onClick={() => setSelectedProvider(provider)}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <div className="min-w-0">
                                  <span className="text-xs font-medium block truncate">{provider.businessName}</span>
                                  <span className="text-[10px] text-muted-foreground">{provider.businessCategory}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {provider.events.length > 0 ? (
                                  <Badge variant="secondary" className="text-[10px]">{provider.events.length}</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] text-muted-foreground">0</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventDetailDialog
          open={!!selectedEvent}
          onOpenChange={() => setSelectedEvent(null)}
          title={selectedEvent.title}
          description={selectedEvent.description}
          rows={[
            { label: "Date", value: selectedEvent.date },
            { label: "Time", value: selectedEvent.time },
            { label: "Location", value: selectedEvent.location },
            { label: "Attendance", value: `${selectedEvent.membersAttended} / ${selectedEvent.membersInvited}` },
            { label: "Revenue", value: `$${selectedEvent.revenue.toLocaleString()}` },
          ]}
        />
      )}

      {selectedProvider && (
        <EventDetailDialog
          open={!!selectedProvider}
          onOpenChange={() => setSelectedProvider(null)}
          title={selectedProvider.businessName}
          description={selectedProvider.businessCategory}
          rows={[
            { label: "Contact", value: selectedProvider.agentName },
            { label: "Participated", value: selectedProvider.participated ? "Yes" : "No" },
            { label: "Total Events", value: String(selectedProvider.events.length) },
            ...(selectedProvider.events.length > 0
              ? [
                  { label: "Total Attendance", value: `${selectedProvider.events.reduce((s, e) => s + e.membersAttended, 0)} / ${selectedProvider.events.reduce((s, e) => s + e.membersInvited, 0)}` },
                  { label: "Total Revenue", value: `$${selectedProvider.events.reduce((s, e) => s + e.revenue, 0).toLocaleString()}` },
                  { label: "Events", value: selectedProvider.events.map(e => `${e.title} (${e.date})`).join(", ") },
                ]
              : []),
          ]}
        />
      )}
    </DashboardLayout>
  );
};

export default AdminHistoricalEventsPage;
