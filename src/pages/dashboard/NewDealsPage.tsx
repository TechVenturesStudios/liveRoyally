import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Store, MapPin, Star, ArrowUp, ArrowDown, Globe, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ViewToggle from "@/components/ui/ViewToggle";
import EventDetailDialog from "@/components/ui/EventDetailDialog";
import { toast } from "sonner";
import {
  claimMemberVoucher,
  fetchMemberNetworkVouchers,
} from "@/api/memberVouchers";
import {
  MemberVoucherRecord,
  getDaysUntilExpiry,
  getVoucherDescription,
  getVoucherDiscountLabel,
  getVoucherExpiryDate,
  getVoucherLocation,
  getVoucherNetworkLabel,
  getVoucherStatusLabel,
  getVoucherTitle,
} from "@/utils/memberVoucherFormatting";

type SortKey = "title" | "provider" | "category" | "discount" | "expiry" | "network";
type SortDir = "asc" | "desc";

const getSortValue = (voucher: MemberVoucherRecord, key: SortKey) => {
  switch (key) {
    case "title":
      return getVoucherTitle(voucher).toLowerCase();
    case "provider":
      return (voucher.provider_name || "").toLowerCase();
    case "category":
      return (voucher.provider_category || "").toLowerCase();
    case "network":
      return getVoucherNetworkLabel(voucher).toLowerCase();
    case "discount":
      return getVoucherDiscountLabel(voucher).toLowerCase();
    case "expiry": {
      const expiry = getVoucherExpiryDate(voucher);
      return expiry ? expiry.getTime() : Number.POSITIVE_INFINITY;
    }
    default:
      return "";
  }
};

const NewDealsPage = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedDeal, setSelectedDeal] = useState<MemberVoucherRecord | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [memberName, setMemberName] = useState("");
  const [availableDeals, setAvailableDeals] = useState<MemberVoucherRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingVoucherId, setClaimingVoucherId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDeals = async () => {
      setLoading(true);
      try {
        const data = await fetchMemberNetworkVouchers();
        if (cancelled) return;

        setMemberName(data.member.networkName || "My Network");
        setSelectedNetwork(data.member.networkCode || "");
        setAvailableDeals(data.vouchers);
      } catch (error) {
        if (cancelled) return;
        console.error("failed to load member network vouchers:", error);
        toast.error(error instanceof Error ? error.message : "Failed to load vouchers");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDeals();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedDeals = useMemo(() => {
    return [...availableDeals].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const valueA = getSortValue(a, sortKey);
      const valueB = getSortValue(b, sortKey);

      if (typeof valueA === "number" && typeof valueB === "number") {
        return (valueA - valueB) * dir;
      }

      return String(valueA).localeCompare(String(valueB)) * dir;
    });
  }, [availableDeals, sortDir, sortKey]);

  const selectedNetworkName = memberName || "My Network";

  const handleClaimDeal = async (voucher: MemberVoucherRecord) => {
    if (claimingVoucherId) return;

    setClaimingVoucherId(voucher.voucher_id);
    try {
      const result = await claimMemberVoucher(voucher.voucher_id);

      if (result.alreadyClaimed) {
        toast.info("This deal was already claimed.");
      } else {
        toast.success("Deal added to Your Vouchers.");
      }

      setAvailableDeals((prev) => prev.filter((item) => item.voucher_id !== voucher.voucher_id));
      setSelectedDeal((current) => (current?.voucher_id === voucher.voucher_id ? null : current));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to claim deal");
    } finally {
      setClaimingVoucherId(null);
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null;
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 inline ml-0.5" />
      : <ArrowDown className="h-3 w-3 inline ml-0.5" />;
  };

  const renderDealSummary = (voucher: MemberVoucherRecord) => {
    const days = getDaysUntilExpiry(voucher);

    return (
      <div className="space-y-1.5 text-sm text-muted-foreground mb-5">
        <div className="flex items-center gap-2">
          <Store className="h-3.5 w-3.5" />
          {voucher.provider_name}
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5" />
          {getVoucherLocation(voucher)}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" />
          {days === null ? "No expiry date" : `${days} day${days === 1 ? "" : "s"} left`}
        </div>
      </div>
    );
  };

  const renderDealDetailRows = (voucher: MemberVoucherRecord) => {
    const expiry = getVoucherExpiryDate(voucher);
    const days = getDaysUntilExpiry(voucher);

    return [
      { label: "Provider", value: voucher.provider_name || "Unknown provider" },
      { label: "Network", value: getVoucherNetworkLabel(voucher) },
      { label: "Voucher ID", value: voucher.voucher_id },
      { label: "Category", value: voucher.provider_category || "Unspecified" },
      { label: "Discount", value: getVoucherDiscountLabel(voucher) },
      { label: "Description", value: getVoucherDescription(voucher) },
      { label: "Location", value: getVoucherLocation(voucher) },
      { label: "Expires", value: expiry ? expiry.toLocaleDateString() : "No expiry date" },
      {
        label: "Days Left",
        value: days === null ? "No expiry date" : `${days} day${days === 1 ? "" : "s"}`,
      },
      { label: "Status", value: getVoucherStatusLabel(voucher.status) },
      { label: "Claimed At", value: voucher.claimed_at ? new Date(voucher.claimed_at).toLocaleString() : "Unknown" },
      { label: "Member Price", value: voucher.member_price !== null ? `$${voucher.member_price.toFixed(2)}` : "Not set" },
      { label: "Max Redemptions", value: voucher.max_redemptions ?? "Unlimited" },
      { label: "Event", value: voucher.event_title || "No event linked" },
      { label: "Provider Phone", value: voucher.provider_phone || "Not provided" },
      { label: "Provider Email", value: voucher.provider_email || "Not provided" },
    ];
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading network deals...
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-barlow font-bold text-2xl sm:text-3xl text-foreground mb-1">New Deals</h1>
            <p className="text-sm text-muted-foreground">Exclusive deals from providers in your network</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Select value={selectedNetwork} onValueChange={setSelectedNetwork} disabled={!selectedNetwork}>
              <SelectTrigger className="w-[240px] h-9 text-xs bg-background">
                <Globe className="h-3.5 w-3.5 mr-1.5 text-primary shrink-0" />
                <SelectValue placeholder="Your network" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value={selectedNetwork}>{memberName || "My Network"}</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
              <Store className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{sortedDeals.length} deals</span>
            </div>
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>
        </div>

        {sortedDeals.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedDeals.map((deal) => (
                <Card key={deal.voucher_id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-primary px-4 py-2 flex items-center justify-between">
                    <span className="text-primary-foreground font-bold text-lg">
                      {getVoucherDiscountLabel(deal) === "Free"
                        ? "Free Item"
                        : `${getVoucherDiscountLabel(deal)} OFF`}
                    </span>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="h-3 w-3" /> New
                    </Badge>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="w-fit">{deal.provider_category || "Voucher"}</Badge>
                      <Badge variant="outline" className="w-fit text-[10px] text-muted-foreground">
                        {getVoucherNetworkLabel(deal)}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold mb-1">{getVoucherTitle(deal)}</h3>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">{getVoucherDescription(deal)}</p>
                    {renderDealSummary(deal)}
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-3 text-xs"
                        onClick={() => setSelectedDeal(deal)}
                      >
                        Details
                      </Button>
                      <Button
                        size="sm"
                        className="px-3 text-xs"
                        disabled={claimingVoucherId === deal.voucher_id}
                        onClick={() => handleClaimDeal(deal)}
                      >
                        {claimingVoucherId === deal.voucher_id ? "Claiming..." : "Claim Deal"}
                      </Button>
                    </div>
                  </div>
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
                        <TableHead className="text-[11px] cursor-pointer select-none" onClick={() => handleSort("title")}>
                          Deal <SortIcon column="title" />
                        </TableHead>
                        <TableHead className="text-[11px] cursor-pointer select-none" onClick={() => handleSort("provider")}>
                          Provider <SortIcon column="provider" />
                        </TableHead>
                        <TableHead className="text-[11px] cursor-pointer select-none" onClick={() => handleSort("category")}>
                          Category <SortIcon column="category" />
                        </TableHead>
                        <TableHead className="text-[11px] cursor-pointer select-none" onClick={() => handleSort("discount")}>
                          Discount <SortIcon column="discount" />
                        </TableHead>
                        <TableHead className="text-[11px] cursor-pointer select-none" onClick={() => handleSort("expiry")}>
                          Expires <SortIcon column="expiry" />
                        </TableHead>
                        <TableHead className="text-[11px] cursor-pointer select-none" onClick={() => handleSort("network")}>
                          Network <SortIcon column="network" />
                        </TableHead>
                        <TableHead className="text-[11px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedDeals.map((deal) => {
                        const days = getDaysUntilExpiry(deal);

                        return (
                          <TableRow key={deal.voucher_id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedDeal(deal)}>
                            <TableCell className="py-2">
                              <div className="font-medium text-xs">{getVoucherTitle(deal)}</div>
                              <div className="text-[11px] text-muted-foreground line-clamp-1">{getVoucherDescription(deal)}</div>
                            </TableCell>
                            <TableCell className="text-xs py-2">{deal.provider_name}</TableCell>
                            <TableCell className="py-2">
                              <Badge variant="outline" className="text-[10px]">
                                {deal.provider_category || "Voucher"}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2 whitespace-nowrap">
                              <Badge className="text-[10px]">{getVoucherDiscountLabel(deal)}</Badge>
                            </TableCell>
                            <TableCell className="text-xs py-2 whitespace-nowrap">
                              {getVoucherExpiryDate(deal)?.toLocaleDateString() || "No expiry"}
                              {days !== null ? <span className="block text-[10px] text-muted-foreground">{days}d left</span> : null}
                            </TableCell>
                            <TableCell className="text-xs py-2">{getVoucherNetworkLabel(deal)}</TableCell>
                            <TableCell className="py-2">
                              <Button
                                size="sm"
                                className="h-6 px-2 text-[11px]"
                                disabled={claimingVoucherId === deal.voucher_id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleClaimDeal(deal);
                                }}
                              >
                                {claimingVoucherId === deal.voucher_id ? "Claiming..." : "Claim"}
                              </Button>
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
              No deals available for {selectedNetworkName}
            </CardContent>
          </Card>
        )}
      </div>

      {selectedDeal && (
        <EventDetailDialog
          open={!!selectedDeal}
          onOpenChange={(open) => !open && setSelectedDeal(null)}
          title={getVoucherTitle(selectedDeal)}
          description={getVoucherDescription(selectedDeal)}
          rows={renderDealDetailRows(selectedDeal)}
          actions={
            <Button
              className="w-full"
              disabled={claimingVoucherId === selectedDeal.voucher_id}
              onClick={() => handleClaimDeal(selectedDeal)}
            >
              {claimingVoucherId === selectedDeal.voucher_id ? "Claiming..." : "Claim Deal"}
            </Button>
          }
        />
      )}
    </DashboardLayout>
  );
};

export default NewDealsPage;
