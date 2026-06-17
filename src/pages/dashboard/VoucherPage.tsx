import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Store, Calendar, Tag, QrCode, Loader2 } from "lucide-react";
import ViewToggle from "@/components/ui/ViewToggle";
import EventDetailDialog from "@/components/ui/EventDetailDialog";
import QRCode from "@/components/qr/QRCode";
import { fetchMemberVouchers } from "@/api/memberVouchers";
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
import { toast } from "sonner";

const VoucherPage = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedVoucher, setSelectedVoucher] = useState<MemberVoucherRecord | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [memberId, setMemberId] = useState("");
  const [vouchers, setVouchers] = useState<MemberVoucherRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadVouchers = async () => {
      setLoading(true);
      try {
        const data = await fetchMemberVouchers();
        if (cancelled) return;

        setMemberId(data.member.id);
        setVouchers(data.vouchers);
      } catch (error) {
        if (cancelled) return;
        console.error("failed to load member vouchers:", error);
        toast.error(error instanceof Error ? error.message : "Failed to load vouchers");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadVouchers();

    return () => {
      cancelled = true;
    };
  }, []);

  const qrVoucher = useMemo(
    () => vouchers.find((voucher) => voucher.voucher_id === showQR) || null,
    [showQR, vouchers]
  );

  const getDetailRows = (voucher: MemberVoucherRecord) => {
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
            Loading your vouchers...
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
            <h1 className="font-barlow font-bold text-2xl sm:text-3xl text-foreground mb-1">Your Vouchers</h1>
            <p className="text-sm text-muted-foreground">Show your QR code at checkout to redeem your deals</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
              <Tag className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{vouchers.length} vouchers</span>
            </div>
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>
        </div>

        {vouchers.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vouchers.map((voucher) => {
                const days = getDaysUntilExpiry(voucher);
                const expiry = getVoucherExpiryDate(voucher);

                return (
                  <Card key={voucher.voucher_id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                    <div className="bg-primary px-4 py-2 flex items-center justify-between">
                      <span className="text-primary-foreground font-bold text-lg flex items-center gap-1.5">
                        <Tag className="h-4 w-4" />
                        {getVoucherDiscountLabel(voucher) === "Free"
                          ? "Free Item"
                          : `${getVoucherDiscountLabel(voucher)} OFF`}
                      </span>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Active
                      </Badge>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="w-fit">{voucher.voucher_id}</Badge>
                        <Badge variant="outline" className="w-fit text-[10px] text-muted-foreground">
                          {getVoucherNetworkLabel(voucher)}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold mb-1">{getVoucherTitle(voucher)}</h3>
                      <p className="text-sm text-muted-foreground mb-4 flex-1">{getVoucherDescription(voucher)}</p>

                      <div className="space-y-1.5 text-sm text-muted-foreground mb-5">
                        <div className="flex items-center gap-2"><Store className="h-3.5 w-3.5" />{voucher.provider_name}</div>
                        <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />{voucher.provider_category || "Unspecified category"}</div>
                        <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />{days === null ? "No expiry date" : `${days} day${days === 1 ? "" : "s"} left`}</div>
                        <div className="flex items-center gap-2"><Store className="h-3.5 w-3.5" />{getVoucherLocation(voucher)}</div>
                        <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />Expires {expiry ? expiry.toLocaleDateString() : "No expiry date"}</div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-3 text-xs"
                          onClick={() => setSelectedVoucher(voucher)}
                        >
                          Details
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1.5 text-xs px-3"
                          onClick={() => setShowQR(voucher.voucher_id)}
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          Show QR
                        </Button>
                      </div>
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
                        <TableHead className="text-[11px]">Voucher</TableHead>
                        <TableHead className="text-[11px]">Provider</TableHead>
                        <TableHead className="text-[11px]">Discount</TableHead>
                        <TableHead className="text-[11px]">Expires</TableHead>
                        <TableHead className="text-[11px]">Time Left</TableHead>
                        <TableHead className="text-[11px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vouchers.map((voucher) => {
                        const days = getDaysUntilExpiry(voucher);
                        const expiry = getVoucherExpiryDate(voucher);

                        return (
                          <React.Fragment key={voucher.voucher_id}>
                            <TableRow
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => setShowQR(showQR === voucher.voucher_id ? null : voucher.voucher_id)}
                            >
                              <TableCell className="py-2">
                                <div className="font-medium text-xs">{getVoucherTitle(voucher)}</div>
                                <div className="text-[11px] text-muted-foreground line-clamp-1">{getVoucherDescription(voucher)}</div>
                              </TableCell>
                              <TableCell className="text-xs py-2">{voucher.provider_name}</TableCell>
                              <TableCell className="py-2">
                                <Badge className="text-[10px]">{getVoucherDiscountLabel(voucher)}</Badge>
                              </TableCell>
                              <TableCell className="text-xs py-2 whitespace-nowrap">{expiry ? expiry.toLocaleDateString() : "No expiry"}</TableCell>
                              <TableCell className={`text-xs py-2 font-medium ${days !== null && days <= 3 ? "text-destructive" : days !== null && days <= 7 ? "text-amber-600" : "text-muted-foreground"}`}>
                                {days === null ? "No expiry" : `${days}d left`}
                              </TableCell>
                              <TableCell className="py-2">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                                  {getVoucherStatusLabel(voucher.status)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
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
              No active vouchers available
            </CardContent>
          </Card>
        )}
      </div>

      {qrVoucher && memberId && (
        <Dialog open={!!showQR} onOpenChange={(open) => !open && setShowQR(null)}>
          <DialogContent className="sm:max-w-xs">
            <div className="flex justify-center py-6">
              <QRCode
                voucherId={qrVoucher.voucher_id}
                eventId={qrVoucher.event_id || "NO-EVENT"}
                useCaseId={String(qrVoucher.type || "N")}
                networkId={qrVoucher.provider_network_code || "NETWORK"}
                userId={memberId}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedVoucher && (
        <EventDetailDialog
          open={!!selectedVoucher}
          onOpenChange={(open) => !open && setSelectedVoucher(null)}
          title={getVoucherTitle(selectedVoucher)}
          description={getVoucherDescription(selectedVoucher)}
          rows={getDetailRows(selectedVoucher)}
          actions={
            <Button
              className="w-full gap-2"
              onClick={() => {
                setSelectedVoucher(null);
                setShowQR(selectedVoucher.voucher_id);
              }}
            >
              <QrCode className="h-4 w-4" />
              Show QR Code
            </Button>
          }
        />
      )}
    </DashboardLayout>
  );
};

export default VoucherPage;
