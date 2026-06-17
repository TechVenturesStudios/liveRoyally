import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Clock, Medal, ArrowRight, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getUserFromStorage } from "@/utils/userStorage";
import { fetchProviderDashboardEvents } from "@/api/providerDashboardEvents";
import { fetchProviderPendingEvents } from "@/api/providerEvents";
import { fetchAuthorizedRepresentatives } from "@/api/authorizedRepresentatives";

const ProviderCRMDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [providerCount, setProviderCount] = useState(0);
  const [pendingEvents, setPendingEvents] = useState(0);
  const [activeEvents, setActiveEvents] = useState(0);
  const [representatives, setRepresentatives] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const user = getUserFromStorage();
        const [eventsResult, pendingResult, repsResult] = await Promise.allSettled([
          fetchProviderDashboardEvents(user?.cognitoId),
          fetchProviderPendingEvents(user?.cognitoId),
          fetchAuthorizedRepresentatives(user?.cognitoId),
        ]);

        if (!isMounted) return;

        setActiveEvents(eventsResult.status === "fulfilled" ? eventsResult.value.filter((event) => event.status === "active").length : 0);
        setPendingEvents(pendingResult.status === "fulfilled" ? pendingResult.value.length : 0);
        setRepresentatives(repsResult.status === "fulfilled" ? repsResult.value.representatives.length : 0);
        setProviderCount(repsResult.status === "fulfilled" ? repsResult.value.networkMembers.length : 0);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load provider CRM";
        toast({ title: "Could not load provider CRM", description: message, variant: "destructive" });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const quickLinks = [
    {
      title: "Events Management",
      description: "Review active and completed events",
      count: activeEvents,
      icon: Calendar,
      action: () => navigate("/dashboard/providers/events"),
    },
    {
      title: "Pending Approvals",
      description: "Handle upcoming event invitations",
      count: pendingEvents,
      icon: Clock,
      action: () => navigate("/dashboard/pending-events"),
    },
    {
      title: "Representatives",
      description: "Manage authorized representatives",
      count: representatives,
      icon: Users,
      action: () => navigate("/dashboard/providers/representatives"),
    },
    {
      title: "Engagement Score",
      description: "View your network activity score",
      count: null,
      icon: Medal,
      action: () => navigate("/dashboard/score"),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20">Provider CRM</Badge>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold royal-header">Provider CRM Dashboard</h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              Overview of your providers, events, and authorized representatives.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active Events</p>
                  <p className="text-2xl font-bold">{loading ? "..." : activeEvents}</p>
                </div>
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending Invites</p>
                  <p className="text-2xl font-bold">{loading ? "..." : pendingEvents}</p>
                </div>
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Reps</p>
                  <p className="text-2xl font-bold">{loading ? "..." : representatives}</p>
                </div>
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Network Members</p>
                  <p className="text-2xl font-bold">{loading ? "..." : providerCount}</p>
                </div>
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickLinks.map((link) => (
            <Card key={link.title} className="group cursor-pointer hover:shadow-md transition-shadow" onClick={link.action}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{link.title}</CardTitle>
                    <CardDescription>{link.description}</CardDescription>
                  </div>
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <link.icon className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {link.count === null ? "Open the dashboard" : `${link.count} item${link.count === 1 ? "" : "s"}`}
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-primary">
                  Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProviderCRMDashboard;

