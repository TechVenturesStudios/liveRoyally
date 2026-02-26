import React, { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShoppingBag, Calendar, Store, DollarSign, Tag } from "lucide-react";
import ViewToggle from "@/components/ui/ViewToggle";
import EventDetailDialog from "@/components/ui/EventDetailDialog";

const mockPurchases = [
  {
    id: "PH-1001",
    voucherId: "VC12345",
    title: "25% Off at Royal Cafe",
    provider: "Royal Cafe",
    originalPrice: 40.0,
    discount: 10.0,
    finalPrice: 30.0,
    date: "2024-04-12",
    status: "completed",
  },
  {
    id: "PH-1002",
    voucherId: "VC12346",
    title: "$10 Off at Elite Boutique",
    provider: "Elite Boutique",
    originalPrice: 75.0,
    discount: 10.0,
    finalPrice: 65.0,
    date: "2024-04-08",
    status: "completed",
  },
  {
    id: "PH-1003",
    voucherId: "VC12340",
    title: "Free Dessert at Golden Table",
    provider: "Golden Table Restaurant",
    originalPrice: 55.0,
    discount: 8.0,
    finalPrice: 47.0,
    date: "2024-03-22",
    status: "completed",
  },
  {
    id: "PH-1004",
    voucherId: "VC12339",
    title: "20% Off Car Wash",
    provider: "Sparkle Auto Wash",
    originalPrice: 25.0,
    discount: 5.0,
    finalPrice: 20.0,
    date: "2024-03-15",
    status: "refunded",
  },
  {
    id: "PH-1005",
    voucherId: "VC12335",
    title: "BOGO Smoothie",
    provider: "Fresh Blend Co.",
    originalPrice: 12.0,
    discount: 6.0,
    finalPrice: 6.0,
    date: "2024-03-01",
    status: "completed",
  },
];

const totalSaved = mockPurchases
  .filter((p) => p.status === "completed")
  .reduce((sum, p) => sum + p.discount, 0);

const PurchaseHistoryPage = () => {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<"grid" | "list">(isMobile ? "grid" : "list");
  const [selectedPurchase, setSelectedPurchase] = useState<typeof mockPurchases[0] | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-barlow font-bold text-2xl sm:text-3xl text-foreground mb-1">Purchase History</h1>
            <p className="text-sm text-muted-foreground">Review your past voucher redemptions and savings</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-100">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">${totalSaved.toFixed(2)} saved</span>
            </div>
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {mockPurchases.map((purchase) => (
              <Card key={purchase.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold truncate">{purchase.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Voucher: {purchase.voucherId}</p>
                  </div>
                  <Badge variant={purchase.status === "completed" ? "default" : "destructive"} className="text-xs shrink-0">
                    {purchase.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Provider</span>
                    <span className="text-foreground">{purchase.provider}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Date</span>
                    <span className="text-foreground">{new Date(purchase.date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">Original</span>
                    <span className="text-foreground">${purchase.originalPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-foreground/60 uppercase tracking-wide">You Paid</span>
                    <span className="text-foreground font-semibold">${purchase.finalPrice.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 mt-3 border-t">
                  <span className="text-xs font-medium text-foreground/60 uppercase tracking-wide">Saved</span>
                  <span className="text-sm font-bold text-green-600">-${purchase.discount.toFixed(2)}</span>
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
                      <TableHead className="text-[11px]">Date</TableHead>
                      <TableHead className="text-[11px]">Deal</TableHead>
                      <TableHead className="text-[11px]">Provider</TableHead>
                      <TableHead className="text-[11px] text-right">Original</TableHead>
                      <TableHead className="text-[11px] text-right">Discount</TableHead>
                      <TableHead className="text-[11px] text-right">Paid</TableHead>
                      <TableHead className="text-[11px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockPurchases.map((purchase) => (
                      <TableRow key={purchase.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPurchase(purchase)}>
                        <TableCell className="text-xs py-2 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(purchase.date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="font-medium text-xs">{purchase.title}</div>
                        </TableCell>
                        <TableCell className="text-xs py-2">
                          <div className="flex items-center gap-1.5">
                            <Store className="h-3 w-3 text-muted-foreground" />
                            {purchase.provider}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs py-2 text-right">${purchase.originalPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-xs py-2 text-right text-green-600 font-medium">-${purchase.discount.toFixed(2)}</TableCell>
                        <TableCell className="text-xs py-2 text-right font-semibold">${purchase.finalPrice.toFixed(2)}</TableCell>
                        <TableCell className="py-2">
                          <Badge variant={purchase.status === "completed" ? "default" : "destructive"} className="text-[10px]">
                            {purchase.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedPurchase && (
        <EventDetailDialog
          open={!!selectedPurchase}
          onOpenChange={(open) => !open && setSelectedPurchase(null)}
          title={selectedPurchase.title}
          description={`Voucher ID: ${selectedPurchase.voucherId}`}
          rows={[
            { label: "Provider", value: selectedPurchase.provider },
            { label: "Date", value: new Date(selectedPurchase.date).toLocaleDateString() },
            { label: "Original Price", value: `$${selectedPurchase.originalPrice.toFixed(2)}` },
            { label: "Discount", value: `-$${selectedPurchase.discount.toFixed(2)}` },
            { label: "You Paid", value: `$${selectedPurchase.finalPrice.toFixed(2)}` },
            { label: "Status", value: <Badge variant={selectedPurchase.status === "completed" ? "default" : "destructive"}>{selectedPurchase.status}</Badge> },
          ]}
        />
      )}
    </DashboardLayout>
  );
};

export default PurchaseHistoryPage;
