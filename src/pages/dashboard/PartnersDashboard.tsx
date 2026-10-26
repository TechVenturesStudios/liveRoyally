
import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { fetchEngagementAnalytics } from "@/api/engagementAnalytics";
import { fetchAuthorizedRepresentatives, type AuthorizedRepresentative } from "@/api/authorizedRepresentatives";
import { addProviderToPartnerEvent, cancelPartnerEvent, fetchPartnerDashboardEvents, type PartnerDashboardEvent } from "@/api/partnerEvents";
import { createEvent, publishEvent, updateEvent } from "@/api/events";
import { fetchPartnerProviders, type PartnerProvider } from "@/api/myProviders";
import { getUserFromStorage } from "@/utils/userStorage";
import { getDashboardContext } from "@/utils/dashboardContext";
import { fetchSquareConnection } from "@/api/square";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Calendar,
  Clock,
  ArrowUpDown,
  PlusCircle,
  Medal,
  BarChart3,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  Send,
  Tag,
  Search,
  CheckCircle2,
  MapPin,
  UserRoundCheck,
  XCircle,
  UserPlus,
} from "lucide-react";

type PartnerAccountProfile = {
  networkName: string | null;
  networkCode: string | null;
  partnerCode: string | null;
  organizationName: string | null;
  organizationAddress: string | null;
  organizationCity: string | null;
  organizationState: string | null;
  organizationZip: string | null;
  organizationEmail: string | null;
  organizationPhone: string | null;
};

type RepresentativeContact = {
  id: string;
  name: string;
  email: string;
  role: string;
  type: string;
};

type DashboardEventContact = {
  id: string;
  providerId: string;
  name: string;
  role: string;
};

type DashboardEventRow = {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  endDate: string;
  time: string;
  networkPoints: number;
  memberPrice: number | null;
  totalVouchersAvailable: number | null;
  deadline: string;
  status: "pending" | "active" | "completed" | "cancelled";
  published: boolean;
  purchaseCount: number;
  contacts: DashboardEventContact[];
};

type EventEditForm = {
  title: string;
  description: string;
  date: string;
  endDate: string;
  time: string;
  location: string;
  memberPrice: string;
  totalVouchersAvailable: string;
  deadline: string;
};

const mapPartnerEventToDashboardRow = (event: PartnerDashboardEvent): DashboardEventRow => ({
  id: event.id,
  title: event.title,
  description: event.description,
  location: event.location,
  date: event.date,
  endDate: event.endDate,
  time: event.time,
  networkPoints: event.networkPoints,
  memberPrice: event.memberPrice,
  totalVouchersAvailable: event.totalVouchersAvailable,
  deadline: event.responseDeadline,
  status: event.status === "active" ? "active" : event.status === "completed" ? "completed" : event.status === "cancelled" ? "cancelled" : "pending",
  published: event.published,
  purchaseCount: event.purchaseCount,
  contacts: event.providers.map((provider) => ({
    id: provider.inviteId,
    providerId: provider.providerId,
    name: provider.providerName,
    role: provider.status,
  })),
});

const PartnersDashboard = () => {
  const [partner, setPartner] = useState<PartnerAccountProfile | null>(null);
  const [events, setEvents] = useState<DashboardEventRow[]>([]);
  const [contacts, setContacts] = useState<RepresentativeContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showCreateEventDialog, setShowCreateEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<DashboardEventRow | null>(null);
  const [editEventForm, setEditEventForm] = useState<EventEditForm>({
    title: "", description: "", date: "", endDate: "", time: "", location: "",
    memberPrice: "", totalVouchersAvailable: "", deadline: "",
  });
  const [rewardPoints, setRewardPoints] = useState(0);
  const [eventsCreatedCount, setEventsCreatedCount] = useState(0);
  const [pendingProviderApplications, setPendingProviderApplications] = useState(0);
  const [createEventForm, setCreateEventForm] = useState({
    title: "",
    description: "",
    date: "",
    endDate: "",
    time: "",
    location: "",
    memberPrice: "",
    totalVouchersAvailable: "",
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
  const [savingEvent, setSavingEvent] = useState(false);
  const [resendProviderIds, setResendProviderIds] = useState<string[]>([]);
  const [publishingEventId, setPublishingEventId] = useState<string | null>(null);
  const [cancellingEventId, setCancellingEventId] = useState<string | null>(null);
  const [addingProviderEvent, setAddingProviderEvent] = useState<DashboardEventRow | null>(null);
  const [addingProviderId, setAddingProviderId] = useState("");
  const [addingProvider, setAddingProvider] = useState(false);
  const [squareConnected, setSquareConnected] = useState(false);
  const [squareConnectionLoading, setSquareConnectionLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadPartnerProfile = async () => {
      try {
        setIsLoading(true);

        const user = getUserFromStorage();
        if (!user?.cognitoId) {
          if (isMounted) {
            setPartner(null);
            setContacts([]);
            setEvents([]);
          }
          return;
        }

        const [profileResult, representativesResult, analyticsResult, partnerEventsResult, pendingApplicationsResult] = await Promise.allSettled([
          fetch(`/api/user-by-id?cognitoId=${encodeURIComponent(user.cognitoId)}`, {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
          }).then(async (response) => {
            const contentType = response.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
              throw new Error("Partner profile API returned a non-JSON response");
            }

            const profileData = await response.json();
            if (!response.ok) {
              throw new Error(profileData.error || "Failed to load partner profile");
            }

            return profileData;
          }),
          fetchAuthorizedRepresentatives(user.cognitoId),
          fetchEngagementAnalytics(user.cognitoId),
          fetchPartnerDashboardEvents(user.cognitoId),
          fetch(`/api/partner/provider-applications?cognitoId=${encodeURIComponent(user.cognitoId)}`, {
            headers: { Accept: "application/json" },
            cache: "no-store",
          }).then(async (response) => {
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to load provider applications");
            return data;
          }),
        ]);

        if (isMounted) {
          if (profileResult.status === "fulfilled") {
            const profileData = profileResult.value;
            setPartner({
              networkName: profileData.profile.networkName ?? null,
              networkCode: profileData.profile.networkCode ?? null,
              partnerCode: profileData.profile.partnerCode ?? null,
              organizationName: profileData.profile.organizationName ?? null,
              organizationAddress: profileData.profile.organizationAddress ?? null,
              organizationCity: profileData.profile.organizationCity ?? null,
              organizationState: profileData.profile.organizationState ?? null,
              organizationZip: profileData.profile.organizationZip ?? null,
              organizationEmail: profileData.profile.organizationEmail ?? null,
              organizationPhone: profileData.profile.organizationPhone ?? null,
            });
          } else if (representativesResult.status === "fulfilled") {
            setPartner({
              networkName: representativesResult.value.organization.networkName ?? null,
              networkCode: representativesResult.value.organization.networkCode ?? null,
              partnerCode: null,
              organizationName: null,
              organizationAddress: null,
              organizationCity: null,
              organizationState: null,
              organizationZip: null,
              organizationEmail: null,
              organizationPhone: null,
            });
          } else {
            console.error("failed to load partner profile:", profileResult.reason);
            setPartner(null);
          }

          if (representativesResult.status === "fulfilled") {
            setContacts(
              representativesResult.value.representatives.map((rep: AuthorizedRepresentative) => ({
                id: rep.assignmentId,
                name: rep.name,
                email: rep.email,
                role: rep.role,
                type: rep.status,
              }))
            );
          } else {
            console.error("failed to load authorized representatives:", representativesResult.reason);
            setContacts([]);
          }

          if (analyticsResult.status === "fulfilled") {
            setRewardPoints(analyticsResult.value.points.balance);
          } else {
            console.error("failed to load engagement analytics:", analyticsResult.reason);
            setRewardPoints(0);
          }

          if (partnerEventsResult.status === "fulfilled") {
            const mappedEvents = partnerEventsResult.value.map(mapPartnerEventToDashboardRow);
            setEvents(mappedEvents);
            setEventsCreatedCount(mappedEvents.length);
          } else {
            console.error("failed to load partner events:", partnerEventsResult.reason);
            setEvents([]);
            setEventsCreatedCount(0);
          }

          if (pendingApplicationsResult.status === "fulfilled") {
            setPendingProviderApplications(Array.isArray(pendingApplicationsResult.value.applications)
              ? pendingApplicationsResult.value.applications.length
              : 0);
          } else {
            console.error("failed to load provider applications:", pendingApplicationsResult.reason);
            setPendingProviderApplications(0);
          }
        }
      } catch (error) {
        console.error("failed to load partner profile:", error);
        if (isMounted) {
          setPartner(null);
          setContacts([]);
          setEvents([]);
          setRewardPoints(0);
          setEventsCreatedCount(0);
          setPendingProviderApplications(0);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPartnerProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    void fetchSquareConnection()
      .then(({ connected }) => {
        if (isMounted) setSquareConnected(connected);
      })
      .catch((error) => {
        console.error("failed to load Square connection:", error);
        if (isMounted) setSquareConnected(false);
      })
      .finally(() => {
        if (isMounted) setSquareConnectionLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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

  const handleSort = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  const handleCreateEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCreateEventForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProviderToggle = (providerId: string) => {
    setSelectedProviders((prev) =>
      prev.includes(providerId) ? prev.filter((id) => id !== providerId) : [...prev, providerId]
    );
  };

  const handleCreateEventSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

const sortedProviders = useMemo(() => {
    let filtered = [...providers];
    if (providerSearch.trim()) {
      const q = providerSearch.toLowerCase();
      filtered = filtered.filter((provider) =>
        provider.businessName.toLowerCase().includes(q) ||
        provider.businessCategory.toLowerCase().includes(q) ||
        provider.businessCity.toLowerCase().includes(q) ||
        `${provider.agentFirstName} ${provider.agentLastName}`.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => {
      const aVal = (a as any)[sortKey] ?? "";
      const bVal = (b as any)[sortKey] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortAsc ? cmp : -cmp;
    });
  }, [providers, sortKey, sortAsc, providerSearch]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      return sortDirection === "asc"
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [events, sortDirection]);

  const pendingEvents = useMemo(
    () => sortedEvents.filter((event) => event.status === "pending"),
    [sortedEvents]
  );

  const historicalEvents = useMemo(
    () => sortedEvents.filter((event) => event.status === "completed"),
    [sortedEvents]
  );

  const handlePublishEvent = async (eventId: string) => {
    try {
      setPublishingEventId(eventId);
      await publishEvent(eventId);
      setEvents((previous) => previous.map((event) => (
        event.id === eventId ? { ...event, published: true } : event
      )));
      toast({ title: "Event published", description: "Members can now see and claim its active vouchers." });
    } catch (error) {
      toast({
        title: "Could not publish event",
        description: error instanceof Error ? error.message : "Failed to publish event",
        variant: "destructive",
      });
    } finally {
      setPublishingEventId(null);
    }
  };

  const handleCancelEvent = async (event: DashboardEventRow) => {
    if (event.status === "cancelled" || new Date(event.date) < new Date(new Date().toISOString().slice(0, 10))) return;
    if (!window.confirm(`Cancel "${event.title}"? This will notify ${event.published ? "network members and " : ""}providers.`)) return;
    try {
      setCancellingEventId(event.id);
      await cancelPartnerEvent(event.id);
      setEvents((previous) => previous.map((item) => item.id === event.id ? { ...item, status: "cancelled" } : item));
      toast({ title: "Event cancelled", description: "The event status was updated and the appropriate notifications were queued." });
    } catch (error) {
      toast({ title: "Could not cancel event", description: error instanceof Error ? error.message : "Failed to cancel event", variant: "destructive" });
    } finally {
      setCancellingEventId(null);
    }
  };

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingProviderEvent || !addingProviderId) return;
    try {
      setAddingProvider(true);
      await addProviderToPartnerEvent(addingProviderEvent.id, addingProviderId);
      const provider = providers.find((item) => item.id === addingProviderId);
      if (provider) {
        setEvents((previous) => previous.map((event) => event.id === addingProviderEvent.id ? {
          ...event,
          contacts: [...event.contacts, { id: `new-${provider.id}`, providerId: provider.id, name: provider.businessName, role: "pending" }],
        } : event));
      }
      setAddingProviderEvent(null);
      setAddingProviderId("");
      toast({ title: "Provider invited", description: "The provider was added to the event and notified by email." });
    } catch (error) {
      toast({ title: "Could not add provider", description: error instanceof Error ? error.message : "Failed to add provider to event", variant: "destructive" });
    } finally {
      setAddingProvider(false);
    }
  };

  const canAddProvider = (event: DashboardEventRow) => event.status !== "cancelled" && new Date(event.date) >= new Date(new Date().toISOString().slice(0, 10)) && (!event.deadline || new Date(event.deadline) >= new Date(new Date().toISOString().slice(0, 10)));

  const handleCreateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createEventForm.title || !createEventForm.date || !createEventForm.endDate || !createEventForm.location || !createEventForm.deadline || selectedProviders.length === 0) {
      toast({
        title: "Missing Fields",
        description: "Please fill all required fields, including the end date and provider response deadline, and select at least one provider.",
        variant: "destructive",
      });
      return;
    }

    const user = getUserFromStorage();
    const partnerId = getDashboardContext()?.targetId ?? user?.id;

    if (!partnerId) {
      toast({ title: "Event creation failed", description: "Could not find the current partner.", variant: "destructive" });
      return;
    }

    try {
      setSubmittingEvent(true);
      const result = await createEvent({
        partnerId,
        title: createEventForm.title,
        description: createEventForm.description,
        startDate: createEventForm.date,
        endDate: createEventForm.endDate,
        location: createEventForm.location,
        eventTime: createEventForm.time,
        memberPrice: createEventForm.memberPrice,
        totalVouchersAvailable: createEventForm.totalVouchersAvailable,
        responseDeadline: createEventForm.deadline,
        providerIds: selectedProviders,
      });

      toast({
        title: result.notifications?.failed
          ? "Event Created with Email Warnings"
          : "Event Created & Sent",
        description: result.notifications?.failed
          ? `"${createEventForm.title}" (${result.eventId}) was created. ${result.notifications.queued}/${selectedProviders.length} provider email(s) were queued.`
          : `"${createEventForm.title}" (${result.eventId}) has been sent to ${selectedProviders.length} provider(s) for approval.`,
      });

      setCreateEventForm({
        title: "",
        description: "",
        date: "",
        endDate: "",
        time: "",
        location: "",
        memberPrice: "",
        totalVouchersAvailable: "",
        deadline: "",
      });
      setSelectedProviders([]);
      setProviderSearch("");
      setShowCreateEventDialog(false);
      setEventsCreatedCount((count) => count + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create event";
      toast({ title: "Event creation failed", description: message, variant: "destructive" });
    } finally {
      setSubmittingEvent(false);
    }
  };

  const resetCreateEventDialog = () => {
    setCreateEventForm({
      title: "",
      description: "",
      date: "",
      endDate: "",
      time: "",
      location: "",
      memberPrice: "",
      totalVouchersAvailable: "",
      deadline: "",
    });
    setSelectedProviders([]);
    setProviderSearch("");
    setProvidersError("");
    setShowCreateEventDialog(false);
  };

  const handleSetDeadline = (eventId: string, newDeadline: string) => {
    // In a real app, this would update the deadline in the database
    const updatedEvents = events.map(event => 
      event.id === eventId ? { ...event, deadline: newDeadline } : event
    );
    setEvents(updatedEvents);
  };

  const handleOpenEditEvent = (event: DashboardEventRow) => {
    setEditingEvent(event);
    setResendProviderIds([]);
    setEditEventForm({
      title: event.title,
      description: event.description,
      date: event.date,
      endDate: event.endDate,
      time: event.time,
      location: event.location,
      memberPrice: event.memberPrice == null ? "" : String(event.memberPrice),
      totalVouchersAvailable: event.totalVouchersAvailable == null ? "" : String(event.totalVouchersAvailable),
      deadline: event.deadline,
    });
  };

  const handleEditEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditEventForm((previous) => ({ ...previous, [e.target.name]: e.target.value }));
  };

  const handleEditEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editEventForm.title || !editEventForm.date || !editEventForm.location) {
      toast({ title: "Missing fields", description: "Title, start date, and location are required.", variant: "destructive" });
      return;
    }

    try {
      setSavingEvent(true);
      const result = await updateEvent({
        eventId: editingEvent.id,
        title: editEventForm.title,
        description: editEventForm.description,
        startDate: editEventForm.date,
        endDate: editEventForm.endDate,
        eventTime: editEventForm.time,
        location: editEventForm.location,
        memberPrice: editEventForm.memberPrice,
        totalVouchersAvailable: editEventForm.totalVouchersAvailable,
        responseDeadline: editEventForm.deadline,
        resendProviderIds,
      });

      setEvents((previous) => previous.map((event) => event.id === editingEvent.id ? {
        ...event,
        title: editEventForm.title,
        description: editEventForm.description,
        date: editEventForm.date,
        endDate: editEventForm.endDate,
        time: editEventForm.time,
        location: editEventForm.location,
        memberPrice: editEventForm.memberPrice === "" ? null : Number(editEventForm.memberPrice),
        totalVouchersAvailable: editEventForm.totalVouchersAvailable === "" ? null : Number(editEventForm.totalVouchersAvailable),
        deadline: editEventForm.deadline,
      } : event));
      setEditingEvent(null);
      toast({
        title: result.notifications.failed ? "Event saved with email warnings" : "Event updated",
        description: result.notifications.failed
          ? `The event was saved, but ${result.notifications.failed} notification(s) could not be queued.`
          : "Notifications were sent only to eligible members and the providers you selected.",
      });
    } catch (error) {
      toast({ title: "Could not update event", description: error instanceof Error ? error.message : "Failed to update event", variant: "destructive" });
    } finally {
      setSavingEvent(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-bold royal-header">Partner Dashboard</h1>
        <p className="text-gray-600 text-xs sm:text-base mt-1 sm:mt-2">
          Manage your organization's events and engagement in the Live Royally network
        </p>
      </div>

      {/* Mobile: compact KPI row */}
      <div className="flex sm:hidden gap-1.5 mb-4">
        <div className="flex-1 px-2 py-1.5 rounded-md bg-purple-50 text-left">
          <p className="text-[9px] font-medium text-purple-800 truncate">Pending</p>
          <p className="text-xs font-bold text-purple-900">{pendingEvents.length}</p>
        </div>
        <div className="flex-1 px-2 py-1.5 rounded-md bg-green-50 text-left">
          <p className="text-[9px] font-medium text-green-800 truncate">Purchases</p>
          <p className="text-xs font-bold text-green-900">{events.reduce((sum, event) => sum + event.purchaseCount, 0)}</p>
        </div>
        <div className="flex-1 flex items-center gap-1 px-2 py-1.5 rounded-md bg-amber-50 text-left">
          <Medal className="h-3 w-3 text-amber-600 shrink-0" />
          <div className="min-w-0">
          <p className="text-[9px] font-medium text-amber-800 truncate">Score</p>
            <p className="text-xs font-bold text-amber-900">{rewardPoints}</p>
          </div>
        </div>
        <button type="button" className="flex-1 px-2 py-1.5 rounded-md bg-blue-50 text-left" onClick={() => navigate("/dashboard/my-providers")}>
          <p className="text-[9px] font-medium text-blue-800 truncate">Applications</p>
          <p className="text-xs font-bold text-blue-900">{pendingProviderApplications}</p>
        </button>
      </div>

      {/* Desktop: full KPI cards */}
      <div className="hidden sm:grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-royal" />
              Pending Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-royal">{pendingEvents.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Total Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {events.reduce((sum, event) => sum + event.purchaseCount, 0)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Medal className="h-5 w-5 text-amber-600" />
              Network Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{rewardPoints}</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/dashboard/my-providers")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              navigate("/dashboard/my-providers");
            }
          }}
          aria-label="Review pending provider applications"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserRoundCheck className="h-5 w-5 text-blue-600" />
              Provider Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{pendingProviderApplications}</p>
            <p className="text-xs text-muted-foreground mt-1">Click to review</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-8">
        <div className="lg:col-span-2">
          <Card className="mb-3 sm:mb-6">
            <CardHeader className="pb-2 px-3 sm:px-6">
              <div className="flex justify-between items-center gap-2">
                <CardTitle className="text-sm sm:text-base">Event Management</CardTitle>
                <Button size="sm" className="bg-royal hover:bg-royal/90 text-xs sm:text-sm" onClick={() => setShowCreateEventDialog(true)}>
                  <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Create Event</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4 h-auto">
                  <TabsTrigger value="pending" className="text-[10px] sm:text-sm py-1.5">Pending</TabsTrigger>
                  <TabsTrigger value="historical" className="text-[10px] sm:text-sm py-1.5">Historical</TabsTrigger>
                  <TabsTrigger value="all" className="text-[10px] sm:text-sm py-1.5">All Events</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pending" className="space-y-4">
                  <div className="flex justify-end mb-2">
                    <Button variant="outline" size="sm" onClick={handleSort} className="flex items-center gap-1">
                      <span>Date</span>
                      {sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Deadline</TableHead>
                          <TableHead>Contacts</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingEvents.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium">{event.title}</TableCell>
                            <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <input 
                                type="date" 
                                defaultValue={event.deadline || event.date}
                                className="border rounded px-2 py-1 text-sm"
                                onChange={(e) => handleSetDeadline(event.id, e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex -space-x-2">
                                {event.contacts.map((contact: any, i: number) => (
                                  <Avatar key={i} className="h-6 w-6 border border-white">
                                    <AvatarFallback className="text-xs">
                                      {contact.name.split(' ').map((n: string) => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleOpenEditEvent(event)}>Edit</Button>
                                {canAddProvider(event) && <Button variant="outline" size="sm" onClick={() => setAddingProviderEvent(event)}><UserPlus className="h-4 w-4 mr-1" />Add provider</Button>}
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => void handlePublishEvent(event.id)}
                                  disabled={publishingEventId === event.id || event.published}
                                >
                                  {publishingEventId === event.id ? "Publishing..." : event.published ? "Published" : "Publish"}
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => void handleCancelEvent(event)} disabled={cancellingEventId === event.id || event.status === "cancelled"}>
                                  <XCircle className="h-4 w-4 mr-1" />{cancellingEventId === event.id ? "Cancelling..." : "Cancel"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="historical" className="space-y-4">
                  <div className="flex justify-end mb-2">
                    <Button variant="outline" size="sm" onClick={handleSort} className="flex items-center gap-1">
                      <span>Date</span>
                      {sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Purchases</TableHead>
                          <TableHead>Contacts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historicalEvents.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium">{event.title}</TableCell>
                            <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {event.purchaseCount} purchases
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex -space-x-2">
                                {event.contacts.map((contact: any, i: number) => (
                                  <Avatar key={i} className="h-6 w-6 border border-white">
                                    <AvatarFallback className="text-xs">
                                      {contact.name.split(' ').map((n: string) => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="all" className="space-y-4">
                  <div className="flex justify-end mb-2">
                    <Button variant="outline" size="sm" onClick={handleSort} className="flex items-center gap-1">
                      <span>Date</span>
                      {sortDirection === "asc" ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Purchases</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedEvents.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium">{event.title}</TableCell>
                            <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                <Badge className={
                                  event.status === "cancelled"
                                    ? "bg-red-100 text-red-800 border-red-200"
                                    : event.status === "pending"
                                    ? "bg-amber-100 text-amber-800 border-amber-200"
                                    : event.status === "active"
                                      ? "bg-blue-100 text-blue-800 border-blue-200"
                                      : "bg-green-100 text-green-800 border-green-200"
                                }>
                                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                </Badge>
                                <Badge variant="outline" className={event.published ? "bg-green-50 text-green-700 border-green-200" : "bg-muted text-muted-foreground"}>
                                  {event.published ? "Published" : "Unpublished"}
                                </Badge>
                                {event.status !== "cancelled" && new Date(event.date) >= new Date(new Date().toISOString().slice(0, 10)) && <Button variant="ghost" size="sm" className="text-red-600" onClick={() => void handleCancelEvent(event)} disabled={cancellingEventId === event.id}>{cancellingEventId === event.id ? "Cancelling..." : "Cancel"}</Button>}
                                {canAddProvider(event) && <Button variant="ghost" size="sm" className="text-primary" onClick={() => setAddingProviderEvent(event)}><UserPlus className="h-4 w-4 mr-1" />Add provider</Button>}
                              </div>
                            </TableCell>
                            <TableCell>{event.purchaseCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          <Dialog open={Boolean(editingEvent)} onOpenChange={(open) => { if (!open && !savingEvent) setEditingEvent(null); }}>
            <DialogContent className="sm:max-w-[650px] max-h-[85vh] p-0 overflow-hidden">
              <form onSubmit={handleEditEventSubmit} className="flex max-h-[85vh] flex-col">
                <DialogHeader className="px-6 pt-6 pb-2">
                  <DialogTitle>Edit Event</DialogTitle>
                  <DialogDescription>Update the event details. Eligible members and participating providers receive updates only for event name, dates, time, or location changes.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[calc(85vh-140px)] px-6 pb-2">
                  <div className="space-y-4 pr-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-event-title">Event Title *</Label>
                      <Input id="edit-event-title" name="title" value={editEventForm.title} onChange={handleEditEventChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-event-description">Description</Label>
                      <Textarea id="edit-event-description" name="description" value={editEventForm.description} onChange={handleEditEventChange} rows={3} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2"><Label htmlFor="edit-event-date">Start Date *</Label><Input id="edit-event-date" name="date" type="date" value={editEventForm.date} onChange={handleEditEventChange} /></div>
                      <div className="space-y-2"><Label htmlFor="edit-event-end-date">End Date</Label><Input id="edit-event-end-date" name="endDate" type="date" value={editEventForm.endDate} onChange={handleEditEventChange} /></div>
                      <div className="space-y-2"><Label htmlFor="edit-event-time">Time</Label><Input id="edit-event-time" name="time" value={editEventForm.time} onChange={handleEditEventChange} /></div>
                      <div className="space-y-2"><Label htmlFor="edit-event-deadline">Provider Response Deadline</Label><Input id="edit-event-deadline" name="deadline" type="date" value={editEventForm.deadline} onChange={handleEditEventChange} /></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="edit-event-location">Location *</Label><Input id="edit-event-location" name="location" value={editEventForm.location} onChange={handleEditEventChange} /></div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-2"><Label htmlFor="edit-event-price">Member Price ($)</Label><Input id="edit-event-price" name="memberPrice" type="number" min="0" step="0.01" value={editEventForm.memberPrice} onChange={handleEditEventChange} disabled={squareConnectionLoading || !squareConnected} />{!squareConnected && <p className="text-xs text-muted-foreground">Connect your Square account on your profile to enable member pricing for vouchers.</p>}</div>
                      <div className="space-y-2"><Label htmlFor="edit-event-vouchers">Vouchers / Provider</Label><Input id="edit-event-vouchers" name="totalVouchersAvailable" type="number" min="1" value={editEventForm.totalVouchersAvailable} onChange={handleEditEventChange} /></div>
                    </div>
                    <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                      <div><Label>Resend invite to providers</Label><p className="text-xs text-muted-foreground">Select providers who should receive this update. This is required to resend a deadline change.</p></div>
                      <div className="space-y-1.5">
                        {editingEvent?.contacts?.map((contact) => {
                          const selected = resendProviderIds.includes(contact.providerId);
                          return <button type="button" key={contact.providerId} onClick={() => setResendProviderIds((current) => selected ? current.filter((id) => id !== contact.providerId) : [...current, contact.providerId])} className={`flex w-full items-center justify-between rounded border px-2 py-1.5 text-left text-xs ${selected ? "border-primary bg-primary/5" : ""}`}><span>{contact.name}</span><Badge variant="outline" className="text-[10px]">{selected ? "Selected" : contact.role}</Badge></button>;
                        })}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                <DialogFooter className="px-6 py-4 border-t">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingEvent(null)} disabled={savingEvent}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={savingEvent || !editEventForm.title || !editEventForm.date || !editEventForm.location}>{savingEvent ? "Saving..." : "Save Changes"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={Boolean(addingProviderEvent)} onOpenChange={(open) => { if (!open && !addingProvider) { setAddingProviderEvent(null); setAddingProviderId(""); } }}>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleAddProvider}>
                <DialogHeader>
                  <DialogTitle>Add provider to event</DialogTitle>
                  <DialogDescription>
                    Invite another provider to {addingProviderEvent?.title || "this event"}. The existing response deadline still applies.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-5 space-y-2">
                  <Label htmlFor="add-event-provider">Provider</Label>
                  <select id="add-event-provider" className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={addingProviderId} onChange={(event) => setAddingProviderId(event.target.value)}>
                    <option value="">Select a provider</option>
                    {addingProviderEvent && providers.filter((provider) => !addingProviderEvent.contacts.some((contact) => contact.providerId === provider.id)).map((provider) => (
                      <option key={provider.id} value={provider.id}>{provider.businessName}</option>
                    ))}
                  </select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setAddingProviderEvent(null)} disabled={addingProvider}>Cancel</Button>
                  <Button type="submit" disabled={addingProvider || !addingProviderId}>{addingProvider ? "Inviting..." : "Invite provider"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog
            open={showCreateEventDialog}
            onOpenChange={(open) => {
              if (open) {
                setShowCreateEventDialog(true);
              } else {
                resetCreateEventDialog();
              }
            }}
          >
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] p-0 overflow-hidden">
              <form onSubmit={handleCreateEventSubmit} className="flex max-h-[85vh] flex-col">
                <DialogHeader className="px-6 pt-6 pb-2">
                  <DialogTitle>Create Event</DialogTitle>
                  <DialogDescription>Create an event and send it to providers for approval.</DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[calc(85vh-140px)] px-6 pb-2">
                  <div className="space-y-6 pr-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Completion</span>
                        <span className="font-medium">
                          {Math.round(((createEventForm.title && createEventForm.date && createEventForm.endDate && createEventForm.location ? 1 : 0) + 1 + (selectedProviders.length > 0 ? 1 : 0)) / 3 * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={Math.round(((createEventForm.title && createEventForm.date && createEventForm.endDate && createEventForm.location ? 1 : 0) + 1 + (selectedProviders.length > 0 ? 1 : 0)) / 3 * 100)}
                        className="h-1.5"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                        <CalendarDays className="h-4 w-4 text-primary" />
                        Event Details
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="create-event-title">Event Title *</Label>
                        <Input
                          id="create-event-title"
                          name="title"
                          value={createEventForm.title}
                          onChange={handleCreateEventChange}
                          placeholder="e.g. Summer Market Festival"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="create-event-description">Description</Label>
                        <Textarea
                          id="create-event-description"
                          name="description"
                          value={createEventForm.description}
                          onChange={handleCreateEventChange}
                          placeholder="What is this event about..."
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="create-event-date">Start Date *</Label>
                          <Input
                            id="create-event-date"
                            name="date"
                            type="date"
                            value={createEventForm.date}
                            onChange={handleCreateEventChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="create-event-end-date">End Date *</Label>
                          <Input
                            id="create-event-end-date"
                            name="endDate"
                            type="date"
                            value={createEventForm.endDate}
                            onChange={handleCreateEventChange}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="create-event-time">Time</Label>
                          <Input
                            id="create-event-time"
                            name="time"
                            value={createEventForm.time}
                            onChange={handleCreateEventChange}
                            placeholder="e.g. 10:00 AM - 4:00 PM"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="create-event-location">Location *</Label>
                          <div className="relative">
                            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="create-event-location"
                              name="location"
                              value={createEventForm.location}
                              onChange={handleCreateEventChange}
                              placeholder="e.g. Downtown Plaza"
                              className="pl-9"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="create-event-member-price">Member Price ($) <span className="font-normal text-muted-foreground">(Optional)</span></Label>
                          <Input
                            id="create-event-member-price"
                            name="memberPrice"
                            type="number"
                            min="0"
                            step="0.01"
                            value={createEventForm.memberPrice}
                            onChange={handleCreateEventChange}
                            placeholder="Leave blank for free vouchers"
                            disabled={squareConnectionLoading || !squareConnected}
                          />
                          <p className="text-xs text-muted-foreground">{squareConnected ? "Applied to every voucher providers create for this event." : "Connect your Square account on your profile to enable member pricing for vouchers."}</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="create-event-voucher-availability">Total Vouchers Available per Provider <span className="font-normal text-muted-foreground">(Optional)</span></Label>
                          <Input id="create-event-voucher-availability" name="totalVouchersAvailable" type="number" min="1" step="1" value={createEventForm.totalVouchersAvailable} onChange={handleCreateEventChange} placeholder="Unlimited claims" />
                          <p className="text-xs text-muted-foreground">How many members can claim each provider’s voucher.</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="create-event-deadline">Provider Response Deadline <span className="text-destructive">*</span></Label>
                          <Input
                            id="create-event-deadline"
                            name="deadline"
                            type="date"
                            value={createEventForm.deadline}
                            onChange={handleCreateEventChange}
                            required
                          />
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
                          <Input
                            placeholder="Search providers..."
                            value={providerSearch}
                            onChange={(e) => setProviderSearch(e.target.value)}
                            className="pl-9 h-8 text-sm"
                          />
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
                              {[
                                { key: "businessName", label: "Business" },
                                { key: "businessCategory", label: "Category" },
                                { key: "businessCity", label: "City" },
                              ].map((column) => (
                                <TableHead
                                  key={column.key}
                                  className="cursor-pointer select-none hover:text-foreground text-xs"
                                  onClick={() => handleCreateEventSort(column.key)}
                                >
                                  <span className="inline-flex items-center gap-1">
                                    {column.label}
                                    <ArrowUpDown className={`h-3 w-3 ${sortKey === column.key ? "text-primary" : "text-muted-foreground"}`} />
                                  </span>
                                </TableHead>
                              ))}
                              <TableHead className="text-right text-xs">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {providersLoading ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground text-xs">
                                  Loading providers...
                                </TableCell>
                              </TableRow>
                            ) : providersError ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-4 text-destructive text-xs">
                                  {providersError}
                                </TableCell>
                              </TableRow>
                            ) : sortedProviders.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground text-xs">
                                  {providerSearch ? "No providers found." : "No providers in your network yet."}
                                </TableCell>
                              </TableRow>
                            ) : (
                              sortedProviders.map((provider) => {
                                const isSelected = selectedProviders.includes(provider.id);
                                return (
                                  <TableRow key={provider.id} className={isSelected ? "bg-primary/5" : ""}>
                                    <TableCell className="font-medium text-xs py-1.5">{provider.businessName}</TableCell>
                                    <TableCell className="text-xs py-1.5">{provider.businessCategory}</TableCell>
                                    <TableCell className="text-xs py-1.5">{provider.businessCity}</TableCell>
                                    <TableCell className="text-right py-1.5">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant={isSelected ? "outline" : "default"}
                                        className={`h-6 text-[11px] px-2 ${isSelected ? "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" : "bg-green-600 hover:bg-green-700 text-white"}`}
                                        onClick={() => handleProviderToggle(provider.id)}
                                      >
                                        {isSelected ? "Remove" : "Select"}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
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
                        ) : (
                          sortedProviders.map((provider) => {
                            const isSelected = selectedProviders.includes(provider.id);
                            return (
                              <div key={provider.id} className={`rounded-lg border p-2.5 ${isSelected ? "border-primary bg-primary/5" : ""}`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="font-medium text-xs truncate">{provider.businessName}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                      {provider.businessCategory} - {provider.businessCity}
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={isSelected ? "outline" : "default"}
                                    className={`shrink-0 h-6 text-[11px] px-2 ${isSelected ? "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" : "bg-green-600 hover:bg-green-700 text-white"}`}
                                    onClick={() => handleProviderToggle(provider.id)}
                                  >
                                    {isSelected ? "Remove" : "Select"}
                                  </Button>
                                </div>
                              </div>
                            );
                          })
                        )}
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
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetCreateEventDialog}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={submittingEvent || !createEventForm.title || !createEventForm.date || !createEventForm.endDate || !createEventForm.location || selectedProviders.length === 0}
                      >
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        {submittingEvent ? "Creating..." : "Send to Providers"}
                      </Button>
                    </div>
                  </div>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Account Profile</span>
                {partner && (
                  <Badge className="bg-royal/10 text-royal border-royal/20">
                    {partner.networkName}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {partner?.organizationName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Organization Details</h4>
                <p className="text-sm text-gray-500">{partner?.organizationAddress}</p>
                <p className="text-sm text-gray-500">{partner?.organizationCity}, {partner?.organizationState} {partner?.organizationZip}</p>
                <p className="text-sm text-gray-500">{partner?.organizationEmail}</p>
                <p className="text-sm text-gray-500">{partner?.organizationPhone}</p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Authorized Representatives (3 max)</h4>
                </div>
                <div className="space-y-2">
                  {contacts.length > 0 ? contacts.map((contact) => (
                    <div key={contact.id} className="rounded bg-muted/20 p-2">
                      <p className="text-sm font-medium">{contact.email}</p>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">No authorized representatives assigned.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Medal className="h-5 w-5 text-royal" />
                Network Engagement
              </CardTitle>
              <CardDescription>Your performance in the network</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Network Score</span>
                  <span className="font-medium">{rewardPoints}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-royal rounded-full" 
                    style={{ width: `${Math.min(rewardPoints / 10, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="pt-2">
                <h4 className="text-sm font-medium mb-2">Performance Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-royal" />
                      Events Created
                    </span>
                    <span className="font-medium">{eventsCreatedCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                      Completed Events
                    </span>
                    <span className="font-medium">{historicalEvents.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center">
                      <BarChart3 className="h-4 w-4 mr-1 text-amber-600" />
                      Total Purchases
                    </span>
                    <span className="font-medium">
                      {sortedEvents.reduce((sum, event) => sum + event.purchaseCount, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard/score")}>
                View Detailed Analytics
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PartnersDashboard;
