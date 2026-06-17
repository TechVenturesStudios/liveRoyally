import React, { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Send, ArrowLeft, ArrowUpDown, CalendarDays, MapPin, Tag, Users, CheckCircle2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { createEvent } from "@/api/events";
import { fetchPartnerProviders, PartnerProvider } from "@/api/myProviders";
import { getUserFromStorage } from "@/utils/userStorage";

const PartnerCreateEventPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
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
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
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

    loadProviders();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProviderToggle = (providerId: string) => {
    setSelectedProviders(prev =>
      prev.includes(providerId) ? prev.filter(id => id !== providerId) : [...prev, providerId]
    );
  };

  const handleSort = (key: string) => {
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
      filtered = filtered.filter(p =>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.location || selectedProviders.length === 0) {
      toast({ title: "Missing Fields", description: "Please fill all required fields and select at least one provider.", variant: "destructive" });
      return;
    }

    const user = getUserFromStorage();
    const partnerId = user?.id;

    if (!partnerId) {
      toast({ title: "Event creation failed", description: "Could not find the current partner.", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      const result = await createEvent({
        partnerId,
        title: formData.title,
        description: formData.description,
        startDate: formData.date,
        endDate: formData.deadline,
        location: formData.location,
        eventTime: formData.time,
        networkPoints: formData.networkPoints,
        responseDeadline: formData.deadline,
        providerIds: selectedProviders,
      });

      toast({
        title: "Event Created & Sent",
        description: `"${formData.title}" (${result.eventId}) has been sent to ${selectedProviders.length} provider(s) for approval.`,
      });
      navigate("/dashboard/partner-pending-events");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create event";
      toast({ title: "Event creation failed", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Progress calculation
  const filledSteps = [
    formData.title && formData.date && formData.location,
    true, // pricing is optional
    selectedProviders.length > 0,
  ].filter(Boolean).length;
  const progressPercent = Math.round((filledSteps / 3) * 100);

  const StepHeader = ({ step, icon: Icon, title, description }: { step: number; icon: React.ElementType; title: string; description: string }) => (
    <CardHeader className="pb-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
          {step}
        </div>
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </div>
    </CardHeader>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto px-1 sm:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="shrink-0">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="font-barlow font-bold text-2xl sm:text-3xl text-foreground">Create Event</h1>
              <p className="text-muted-foreground text-xs sm:text-sm">Fill in the details below to create and send your event to providers</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-medium text-foreground">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className={formData.title && formData.date && formData.location ? "text-primary font-medium" : ""}>
              ① Event Details
            </span>
            <span className="text-muted-foreground/50">② Pricing (Provider)</span>
            <span className={selectedProviders.length > 0 ? "text-primary font-medium" : ""}>
              ③ Providers
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Event Details */}
          <Card>
            <StepHeader step={1} icon={CalendarDays} title="Event Details" description="Basic information about your event" />
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title <span className="text-destructive">*</span></Label>
                <Input id="title" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Summer Market Festival" className="text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Tell providers and members what this event is about..." rows={3} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    Event Date <span className="text-destructive">*</span>
                  </Label>
                  <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input id="time" name="time" value={formData.time} onChange={handleChange} placeholder="e.g. 10:00 AM - 4:00 PM" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    Location <span className="text-destructive">*</span>
                  </Label>
                  <Input id="location" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Downtown Plaza" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="networkPoints">Network Points Reward</Label>
                  <Input id="networkPoints" name="networkPoints" type="number" value={formData.networkPoints} onChange={handleChange} placeholder="e.g. 200" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Provider Response Deadline</Label>
                  <Input id="deadline" name="deadline" type="date" value={formData.deadline} onChange={handleChange} />
                  <p className="text-xs text-muted-foreground">Optional — providers must respond by this date</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Pricing & Offers (Greyed out for partners) */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-background/60 z-10 flex items-center justify-center p-4">
              <div className="bg-muted border rounded-lg px-4 py-3 text-center max-w-[280px]">
                <Tag className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-sm font-medium text-foreground">Provider Responsibility</p>
                <p className="text-xs text-muted-foreground mt-1">Pricing & offers will be filled in by providers after they receive the event invitation.</p>
              </div>
            </div>
            <div className="opacity-40 pointer-events-none">
              <StepHeader step={2} icon={Tag} title="Pricing & Offers" description="Providers add member pricing and optional discounts" />
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Member Price ($)</Label>
                    <Input disabled placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Redemptions</Label>
                    <Input disabled placeholder="Unlimited" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Discount / Offer Type</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {["No Discount", "% Off", "$ Amount Off", "Free Item"].map((label) => (
                      <div key={label} className="flex items-center gap-2 p-3 rounded-lg border border-border text-sm font-medium text-muted-foreground">
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Step 3: Select Providers */}
          <Card>
            <StepHeader step={3} icon={Users} title="Select Providers" description="Choose which providers to invite to this event" />
            <CardContent className="space-y-4">
              {/* Search + selected count */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search providers..."
                    value={providerSearch}
                    onChange={(e) => setProviderSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {selectedProviders.length > 0 && (
                  <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                    {selectedProviders.length} selected
                  </div>
                )}
              </div>

              {/* Desktop: Table view */}
              <div className="hidden md:block rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      {[
                        { key: "businessName", label: "Business Name" },
                        { key: "businessCategory", label: "Category" },
                        { key: "businessCity", label: "City" },
                        { key: "businessState", label: "State" },
                        { key: "agentFirstName", label: "Contact" },
                      ].map((col) => (
                        <TableHead
                          key={col.key}
                          className="cursor-pointer select-none hover:text-foreground transition-colors"
                          onClick={() => handleSort(col.key)}
                        >
                          <span className="inline-flex items-center gap-1">
                            {col.label}
                            <ArrowUpDown className={`h-3 w-3 ${sortKey === col.key ? "text-primary" : "text-muted-foreground"}`} />
                          </span>
                        </TableHead>
                      ))}
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providersLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Loading providers...
                        </TableCell>
                      </TableRow>
                    ) : providersError ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-destructive">
                          {providersError}
                        </TableCell>
                      </TableRow>
                    ) : sortedProviders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {providerSearch ? "No providers found matching your search." : "No providers in your network yet."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedProviders.map((provider) => {
                        const isSelected = selectedProviders.includes(provider.id);
                        return (
                          <TableRow
                            key={provider.id}
                            className={`transition-colors ${isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"}`}
                          >
                            <TableCell className="font-medium">{provider.businessName}</TableCell>
                            <TableCell>{provider.businessCategory}</TableCell>
                            <TableCell>{provider.businessCity}</TableCell>
                            <TableCell>{provider.businessState}</TableCell>
                            <TableCell>{provider.agentFirstName} {provider.agentLastName}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                size="sm"
                                variant={isSelected ? "outline" : "default"}
                                className={
                                  isSelected
                                    ? "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                    : "bg-green-600 hover:bg-green-700 text-white"
                                }
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

              {/* Mobile: Card view */}
              <div className="md:hidden space-y-3">
                {providersLoading ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">Loading providers...</p>
                ) : providersError ? (
                  <p className="text-center py-8 text-destructive text-sm">{providersError}</p>
                ) : sortedProviders.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-sm">{providerSearch ? "No providers found matching your search." : "No providers in your network yet."}</p>
                ) : (
                  sortedProviders.map((provider) => {
                    const isSelected = selectedProviders.includes(provider.id);
                    return (
                      <div
                        key={provider.id}
                        className={`rounded-lg border p-3 transition-colors ${isSelected ? "border-primary bg-primary/5" : "border-border"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{provider.businessName}</p>
                            <p className="text-xs text-muted-foreground">{provider.businessCategory}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {provider.businessCity}, {provider.businessState}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Contact: {provider.agentFirstName} {provider.agentLastName}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant={isSelected ? "outline" : "default"}
                            className={`shrink-0 ${
                              isSelected
                                ? "border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                : "bg-green-600 hover:bg-green-700 text-white"
                            }`}
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
            </CardContent>
          </Card>

          {/* Submit footer */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground text-center sm:text-left">
                  {selectedProviders.length === 0 ? (
                    <span>Select at least one provider to continue</span>
                  ) : (
                    <span className="text-foreground font-medium">
                      Ready to send to {selectedProviders.length} provider(s)
                    </span>
                  )}
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1 sm:flex-none">Cancel</Button>
                  <Button type="submit" disabled={submitting || !formData.title || !formData.date || !formData.location || selectedProviders.length === 0} className="flex-1 sm:flex-none">
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? "Creating..." : "Create & Send"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default PartnerCreateEventPage;
