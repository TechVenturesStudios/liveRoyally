
import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Store, Calendar, Tag, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import QRCode from "@/components/qr/QRCode";
import ViewToggle from "@/components/ui/ViewToggle";
import EventDetailDialog from "@/components/ui/EventDetailDialog";

const vouchers = [
  {
    id: "VC12345",
    eventId: "EV0001",
    useCaseId: "A1",
    networkId: "royal",
    title: "25% Off at Royal Cafe",
    description: "Get 25% off your entire purchase at Royal Cafe",
    provider: "Royal Cafe",
    expiry: "2026-05-15",
    status: "active" as const,
    discount: "25%",
  },
  {
    id: "VC12346",
    eventId: "EV0002",
    useCaseId: "B1",
    networkId: "royal",
    title: "$10 Off at Elite Boutique",
    description: "Get $10 off any purchase over $50 at Elite Boutique",
    provider: "Elite Boutique",
    expiry: "2026-05-20",
    status: "active" as const,
    discount: "$10",
  },
];

type Voucher = typeof vouchers[0];

const VoucherPage = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  const qrVoucher = vouchers.find((v) => v.id === showQR) || null;

  const getUserId = () => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      const user = JSON.parse(userJson);
      return user.id || "30001";
    }
    return "30001";
  };

  const daysUntilExpiry = (expiry: string) => {
    const diff = new Date(expiry).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getExpiryColor = (days: number) => {
    if (days <= 3) return "text-destructive";
    if (days <= 7) return "text-amber-600";
    return "text-muted-foreground";
  };

  const getDetailRows = (v: Voucher) => [
    { label: "Provider", value: v.provider },
    { label: "Voucher ID", value: v.id },
    { label: "Description", value: v.description },
    { label: "Expires", value: new Date(v.expiry).toLocaleDateString() },
    {
      label: "Days Left",
      value: (
        <span className={getExpiryColor(daysUntilExpiry(v.expiry))}>
          {daysUntilExpiry(v.expiry)} days
        </span>
      ),
    },
    {
      label: "Status",
      value: (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          {v.status}
        </Badge>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header — matches NewDeals */}
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
                const days = daysUntilExpiry(voucher.expiry);
                

                return (
                  <Card key={voucher.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                    {/* Discount banner — matches NewDeals */}
                    <div className="bg-primary px-4 py-2 flex items-center justify-between">
                      <span className="text-primary-foreground font-bold text-lg flex items-center gap-1.5">
                        <Tag className="h-4 w-4" />
                        {voucher.discount} OFF
                      </span>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Active
                      </Badge>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <Badge variant="outline" className="w-fit mb-3">{voucher.id}</Badge>
                      <h3 className="text-lg font-bold mb-1">{voucher.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4 flex-1">{voucher.description}</p>

                      <div className="space-y-1.5 text-sm text-muted-foreground mb-5">
                        <div className="flex items-center gap-2"><Store className="h-3.5 w-3.5" />{voucher.provider}</div>
                        <div className={`flex items-center gap-2 ${getExpiryColor(days)}`}>
                          <Clock className="h-3.5 w-3.5" />
                          {days} day{days !== 1 ? "s" : ""} left
                        </div>
                        <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />Expires {new Date(voucher.expiry).toLocaleDateString()}</div>
                      </div>

                      {/* QR Code toggle */}
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
                            onClick={() => setShowQR(voucher.id)}
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
                        const days = daysUntilExpiry(voucher.expiry);
                        return (
                          <React.Fragment key={voucher.id}>
                            <TableRow
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => setShowQR(showQR === voucher.id ? null : voucher.id)}
                            >
                              <TableCell className="py-2">
                                <div className="font-medium text-xs">{voucher.title}</div>
                                <div className="text-[11px] text-muted-foreground line-clamp-1">{voucher.description}</div>
                              </TableCell>
                              <TableCell className="text-xs py-2">{voucher.provider}</TableCell>
                              <TableCell className="py-2"><Badge className="text-[10px]">{voucher.discount}</Badge></TableCell>
                              <TableCell className="text-xs py-2 whitespace-nowrap">{new Date(voucher.expiry).toLocaleDateString()}</TableCell>
                              <TableCell className={`text-xs py-2 font-medium ${getExpiryColor(days)}`}>{days}d left</TableCell>
                              <TableCell className="py-2">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                                  {voucher.status}
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

      {/* QR Code Dialog */}
      {qrVoucher && (
        <Dialog open={!!showQR} onOpenChange={(open) => !open && setShowQR(null)}>
          <DialogContent className="sm:max-w-xs">
            <div className="flex justify-center py-6">
              <div className="p-3 border-4 border-primary rounded-lg">
                <QRCodeSVG
                  value={`${qrVoucher.id}-${qrVoucher.eventId}-${qrVoucher.useCaseId}-${qrVoucher.networkId}-${getUserId()}`}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedVoucher && (
        <EventDetailDialog
          open={!!selectedVoucher}
          onOpenChange={(open) => !open && setSelectedVoucher(null)}
          title={selectedVoucher.title}
          description={selectedVoucher.description}
          rows={getDetailRows(selectedVoucher)}
          actions={
            <Button
              className="w-full gap-2"
              onClick={() => {
                setSelectedVoucher(null);
                setShowQR(selectedVoucher.id);
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
