
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, Users, MapPin, CalendarCheck } from "lucide-react";

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

interface ProviderEventInfoProps {
  events: Event[];
}

const ProviderEventInfo = ({ events }: ProviderEventInfoProps) => {
  const pendingEvents = events.filter(e => e.status === "pending");
  const upcomingEvents = events.filter(e => e.status === "active");
  const pastEvents = events.filter(e => e.status === "completed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-barlow font-bold">Event Info</h2>
      </div>

      {/* Pending Invitations */}
      {pendingEvents.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-amber-100">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <CardTitle className="text-sm">Pending Invitations</CardTitle>
              <Badge variant="secondary" className="text-xs ml-auto bg-amber-100 text-amber-800">{pendingEvents.length}</Badge>
            </div>
            <CardDescription className="text-xs">Events you've been invited to — respond with your pricing</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {pendingEvents.map(evt => (
                <div key={evt.id} className="border rounded-lg p-3 bg-background">
                  <div className="flex justify-between items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm">{evt.title}</h3>
                    <Badge className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0 shrink-0">Pending</Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{evt.organizer}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{evt.date}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{evt.location}</span>
                    <span>{evt.networkScore} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming & Past Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-blue-100">
                <CalendarCheck className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <CardTitle className="text-sm">Upcoming Events</CardTitle>
              <Badge variant="secondary" className="text-xs ml-auto">{upcomingEvents.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ScrollArea className="h-[220px]">
              <div className="space-y-2 pr-2">
                {upcomingEvents.length > 0 ? upcomingEvents.map(evt => (
                  <div key={evt.id} className="border rounded-lg p-2.5">
                    <div className="flex justify-between items-center gap-2 mb-1">
                      <h3 className="font-medium text-xs truncate">{evt.title}</h3>
                      <Badge className="bg-blue-100 text-blue-800 shrink-0 text-[10px] px-1.5 py-0">Upcoming</Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground mb-1">{evt.date} · {evt.time}</div>
                    <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{evt.location}</span>
                      <span>{evt.networkScore} pts</span>
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
                {pastEvents.length > 0 ? pastEvents.map(evt => (
                  <div key={evt.id} className="border rounded-lg p-2.5">
                    <div className="flex justify-between items-center gap-2 mb-1">
                      <h3 className="font-medium text-xs truncate">{evt.title}</h3>
                      <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">
                        {evt.participated ? "Participated" : "Completed"}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground mb-1">{evt.date} · {evt.location}</div>
                    <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{evt.organizer}</span>
                      <span>Score: {evt.networkScore} pts</span>
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
    </div>
  );
};

export default ProviderEventInfo;
