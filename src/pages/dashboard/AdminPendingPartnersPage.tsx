import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ViewToggle from "@/components/ui/ViewToggle";
import EventDetailDialog from "@/components/ui/EventDetailDialog";
import { Building, Clock, CheckCircle, XCircle, ArrowLeft, CreditCard } from "lucide-react";
import { toast } from "sonner";
import {
  fetchPendingPartnerApplications,
  updatePendingPartnerApplication,
  type AdminPendingPartner,
} from "@/api/adminPartners";
import { PARTNER_SUBSCRIPTION_PLANS } from "@/config/subscriptionPlans";

const formatMoney = (cents: number, currency: string) => {
  const safeCents = Number.isFinite(cents) ? cents : 0;
  const safeCurrency =
    typeof currency === "string" && currency.trim().length === 3
      ? currency.trim().toUpperCase()
      : "USD";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: safeCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeCents / 100);
  } catch {
    return `$${(safeCents / 100).toFixed(2)}`;
  }
};

const resolvePlanLabel = (partner: AdminPendingPartner) => {
  const plan = PARTNER_SUBSCRIPTION_PLANS[partner.plan];
  return partner.planLabel || plan?.label || partner.plan || "Unknown plan";
};

const AdminPendingPartnersPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || "/dashboard/admin/profile";
  const backLabel = from.includes("analytics") ? "Back to Analytics" : "Back to Home";
  const { isLoading } = useAuthCheck();
  const [partners, setPartners] = useState<AdminPendingPartner[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedPartner, setSelectedPartner] = useState<AdminPendingPartner | null>(null);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPartners = async () => {
      try {
        setLoadingPartners(true);
        const result = await fetchPendingPartnerApplications();

        if (!cancelled) {
          setPartners(result.pendingPartners);
        }
      } catch (error) {
        if (!cancelled) {
          setPartners([]);
          toast.error(error instanceof Error ? error.message : "Failed to load pending partners");
        }
      } finally {
        if (!cancelled) {
          setLoadingPartners(false);
        }
      }
    };

    loadPartners();

    return () => {
      cancelled = true;
    };
  }, []);

  const pendingCount = partners.length;

  const handleAction = async (partner: AdminPendingPartner, action: "approve" | "decline") => {
    try {
      setActionInFlight(partner.subscriptionId);
      await updatePendingPartnerApplication({
        subscriptionId: partner.subscriptionId,
        action,
      });

      setPartners((prev) => prev.filter((item) => item.subscriptionId !== partner.subscriptionId));
      setSelectedPartner(null);

      if (action === "approve") {
        toast.success(
          `${partner.organizationName} approved and charged ${formatMoney(
            partner.monthlyPriceCents,
            partner.currency
          )}`
        );
      } else {
        toast.error(`${partner.organizationName} has been declined`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update application");
    } finally {
      setActionInFlight(null);
    }
  };

  const getDetailRows = (partner: AdminPendingPartner) => {
    const planLabel = resolvePlanLabel(partner);
    const planPrice = formatMoney(partner.monthlyPriceCents, partner.currency);
    const contactName = `${partner.agentFirstName || ""} ${partner.agentLastName || ""}`.trim();

    return [
      { label: "Organization", value: partner.organizationName },
      { label: "Category", value: partner.organizationCategory || "Not provided" },
      { label: "Contact", value: contactName || "Not provided" },
      { label: "Email", value: partner.organizationEmail },
      { label: "Phone", value: partner.organizationPhone || "Not provided" },
      {
        label: "Address",
        value: [partner.organizationAddress, partner.organizationCity, partner.organizationState, partner.organizationZip]
          .filter(Boolean)
          .join(", ") || "Not provided",
      },
      {
        label: "Network",
        value: partner.networkName
          ? `${partner.networkName} (${partner.networkCode || "—"})`
          : partner.networkCode || "Not assigned",
      },
      { label: "Subscription Tier", value: planLabel },
      { label: "Tier Price", value: planPrice },
      {
        label: "Card on File",
        value: <Badge variant="outline" className="bg-emerald-50 text-emerald-700">Stored for later charge</Badge>,
      },
      {
        label: "Submitted",
        value: partner.submittedAt ? new Date(partner.submittedAt).toLocaleString() : "Unknown",
      },
    ];
  };

  const displayedPartners = partners;

  if (isLoading) return <LoadingSpinner />;

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
            <h1 className="font-barlow font-bold text-2xl sm:text-3xl text-foreground mb-1">Pending Partners</h1>
            <p className="text-sm text-muted-foreground">
              Review partner applications before charging their stored card
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">
                {loadingPartners ? "Loading..." : `${pendingCount} pending`}
              </span>
            </div>
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>
        </div>

        {displayedPartners?.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayedPartners?.map((partner) => {
                const planLabel = resolvePlanLabel(partner);
                const planPrice = formatMoney(partner?.monthlyPriceCents, partner?.currency);
                const contactName = `${partner?.agentFirstName || ""} ${partner?.agentLastName || ""}`.trim();

                return (
                  <Card
                    key={partner?.subscriptionId}
                    className="flex flex-col cursor-pointer hover:shadow-md transition-all"
                    onClick={() => setSelectedPartner(partner)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base font-semibold truncate">{partner?.organizationName}</CardTitle>
                          <CardDescription className="mt-1">{partner?.organizationCategory || "Pending partner"}</CardDescription>
                        </div>
                        <div className="rounded-full p-2 bg-muted shrink-0">
                          <Building className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div>
                          <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Contact</span>
                          <span className="text-foreground text-xs">{contactName || "Not provided"}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Location</span>
                          <span className="text-foreground text-xs">
                            {[partner?.organizationCity, partner?.organizationState].filter(Boolean).join(", ") || "Not provided"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Plan</span>
                          <span className="text-foreground text-xs">{planLabel}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Amount</span>
                          <span className="text-foreground text-xs">{planPrice}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t">
                        <span className="text-xs font-medium text-foreground/60 uppercase tracking-wide">Submitted</span>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0">
                          {partner?.submittedAt ? new Date(partner?.submittedAt).toLocaleDateString() : "Unknown"}
                        </Badge>
                      </div>
                    </CardContent>
                    <div className="p-4 pt-0 flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={actionInFlight === partner?.subscriptionId}
                        onClick={() => handleAction(partner, "approve")}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        disabled={actionInFlight === partner?.subscriptionId}
                        onClick={() => handleAction(partner, "decline")}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Decline
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px]">Organization</TableHead>
                        <TableHead className="text-[11px]">Plan</TableHead>
                        <TableHead className="text-[11px]">Contact</TableHead>
                        <TableHead className="text-[11px]">Amount</TableHead>
                        <TableHead className="text-[11px]">Submitted</TableHead>
                        <TableHead className="text-[11px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedPartners?.map((partner) => {
                        const planLabel = resolvePlanLabel(partner);
                        const planPrice = formatMoney(partner?.monthlyPriceCents, partner?.currency);
                        const contactName = `${partner?.agentFirstName || ""} ${partner?.agentLastName || ""}`.trim();

                        return (
                          <TableRow
                            key={partner?.subscriptionId}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setSelectedPartner(partner)}
                          >
                            <TableCell className="py-2">
                              <div className="font-medium text-xs">{partner?.organizationName}</div>
                              <div className="text-[11px] text-muted-foreground">{partner?.organizationEmail}</div>
                            </TableCell>
                            <TableCell className="text-xs py-2">{planLabel}</TableCell>
                            <TableCell className="text-xs py-2">{contactName || "Not provided"}</TableCell>
                            <TableCell className="text-xs py-2">{planPrice}</TableCell>
                            <TableCell className="py-2">
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0">
                                {partner?.submittedAt ? new Date(partner?.submittedAt).toLocaleDateString() : "Unknown"}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  className="h-6 px-2 text-[10px] bg-green-600 hover:bg-green-700"
                                  disabled={actionInFlight === partner?.subscriptionId}
                                  onClick={() => handleAction(partner, "approve")}
                                >
                                  <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-6 px-2 text-[10px]"
                                  disabled={actionInFlight === partner?.subscriptionId}
                                  onClick={() => handleAction(partner, "decline")}
                                >
                                  <XCircle className="h-2.5 w-2.5 mr-0.5" /> Decline
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No pending partner applications
            </CardContent>
          </Card>
        )}
      </div>

      {selectedPartner && (
        <EventDetailDialog
          open={!!selectedPartner}
          onOpenChange={() => setSelectedPartner(null)}
          title={selectedPartner.organizationName}
          description={selectedPartner?.organizationCategory || "Pending partner application"}
          rows={getDetailRows(selectedPartner)}
          actions={
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5" />
                Approving will charge the stored Square card and activate the subscription.
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={actionInFlight === selectedPartner?.subscriptionId}
                  onClick={() => handleAction(selectedPartner, "approve")}
                >
                  <CheckCircle className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  disabled={actionInFlight === selectedPartner?.subscriptionId}
                  onClick={() => handleAction(selectedPartner, "decline")}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Decline
                </Button>
              </div>
            </div>
          }
        />
      )}
    </DashboardLayout>
  );
};

export default AdminPendingPartnersPage;
