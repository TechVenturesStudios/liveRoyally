import React, { useState, useMemo } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Store, MapPin, Star, ArrowUp, ArrowDown, Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ViewToggle from "@/components/ui/ViewToggle";
import EventDetailDialog from "@/components/ui/EventDetailDialog";

// Mock networks available by zip code area
const mockNetworks = [
  { code: "ROYAL1", name: "Royal Network", area: "Houston, TX", zipPrefixes: ["770", "771", "772", "773"] },
  { code: "METRO1", name: "Metro Alliance", area: "Houston, TX", zipPrefixes: ["770", "774", "775"] },
  { code: "WEST1", name: "Westside Collective", area: "Sugar Land, TX", zipPrefixes: ["774", "775"] },
];

const mockDeals = [
  {
    id: "DL-001",
    title: "30% Off Weekend Brunch",
    provider: "The Golden Table",
    category: "Dining",
    location: "Houston, TX",
    discount: "30%",
    description: "Enjoy a luxurious weekend brunch with 30% off the entire menu. Valid Saturday and Sunday only.",
    expiry: "2024-06-01",
    featured: true,
    networkCode: "ROYAL1",
  },
  {
    id: "DL-002",
    title: "Buy 1 Get 1 Free Smoothie",
    provider: "Fresh Blend Co.",
    category: "Food & Drink",
    location: "Houston, TX",
    discount: "BOGO",
    description: "Purchase any smoothie and get the second one free. All flavors included.",
    expiry: "2024-05-25",
    featured: false,
    networkCode: "ROYAL1",
  },
  {
    id: "DL-003",
    title: "$15 Off Full Detail Wash",
    provider: "Sparkle Auto Wash",
    category: "Automotive",
    location: "Houston, TX",
    discount: "$15",
    description: "Get $15 off a full interior and exterior detail wash. Appointment required.",
    expiry: "2024-06-10",
    featured: true,
    networkCode: "METRO1",
  },
  {
    id: "DL-004",
    title: "20% Off Any Haircut",
    provider: "Crown Barber Lounge",
    category: "Beauty",
    location: "Houston, TX",
    discount: "20%",
    description: "First-time and returning members get 20% off any haircut service.",
    expiry: "2024-05-30",
    featured: false,
    networkCode: "METRO1",
  },
  {
    id: "DL-005",
    title: "Free Appetizer with Entrée",
    provider: "Royal Cafe",
    category: "Dining",
    location: "Houston, TX",
    discount: "Free",
    description: "Order any entrée and receive a complimentary appetizer of your choice.",
    expiry: "2024-06-15",
    featured: false,
    networkCode: "ROYAL1",
  },
  {
    id: "DL-006",
    title: "40% Off First Month Membership",
    provider: "Elite Fitness Hub",
    category: "Health & Fitness",
    location: "Sugar Land, TX",
    discount: "40%",
    description: "New members get 40% off their first month. Includes full gym access and one free personal training session.",
    expiry: "2024-06-20",
    featured: true,
    networkCode: "WEST1",
  },
];

type Deal = typeof mockDeals[0];
type SortKey = "title" | "provider" | "category" | "discount" | "expiry" | "featured";
type SortDir = "asc" | "desc";

const getDiscountType = (discount: string): string => {
  const lower = discount.toLowerCase();
  if (lower === "free") return "Free";
  if (lower === "bogo") return "BOGO";
  if (discount.startsWith("$")) return "$ Off";
  if (discount.endsWith("%")) return "% Off";
  return discount;
};

const discountSortOrder: Record<string, number> = {
  "Free": 0,
  "$ Off": 1,
  "% Off": 2,
  "BOGO": 3,
};

const getUserZip = (): string => {
  const userJson = localStorage.getItem("user");
  if (userJson) {
    const user = JSON.parse(userJson);
    return user.zipCode || "77001";
  }
  return "77001";
};

const NewDealsPage = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const userZip = getUserZip();
  const zipPrefix = userZip.substring(0, 3);

  // Networks available near the member's zip code
  const nearbyNetworks = useMemo(
    () => mockNetworks.filter((n) => n.zipPrefixes.includes(zipPrefix)),
    [zipPrefix]
  );

  const [selectedNetwork, setSelectedNetwork] = useState<string>(
    nearbyNetworks[0]?.code || "all"
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filteredDeals = useMemo(() => {
    if (selectedNetwork === "all") return mockDeals;
    return mockDeals.filter((d) => d.networkCode === selectedNetwork);
  }, [selectedNetwork]);

  const sortedDeals = useMemo(() => {
    return [...filteredDeals].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;

      if (sortKey === "discount") {
        const typeA = getDiscountType(a.discount);
        const typeB = getDiscountType(b.discount);
        const orderA = discountSortOrder[typeA] ?? 99;
        const orderB = discountSortOrder[typeB] ?? 99;
        if (orderA !== orderB) return (orderA - orderB) * dir;
        const numA = parseFloat(a.discount.replace(/[^0-9.]/g, "")) || 0;
        const numB = parseFloat(b.discount.replace(/[^0-9.]/g, "")) || 0;
        return (numA - numB) * dir;
      }

      if (sortKey === "featured") {
        return ((a.featured === b.featured) ? 0 : a.featured ? -1 : 1) * dir;
      }

      if (sortKey === "expiry") {
        return (new Date(a.expiry).getTime() - new Date(b.expiry).getTime()) * dir;
      }

      const valA = a[sortKey].toLowerCase();
      const valB = b[sortKey].toLowerCase();
      return valA.localeCompare(valB) * dir;
    });
  }, [sortKey, sortDir, filteredDeals]);

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null;
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 inline ml-0.5" />
      : <ArrowDown className="h-3 w-3 inline ml-0.5" />;
  };

  const selectedNetworkName = mockNetworks.find((n) => n.code === selectedNetwork)?.name || "All Networks";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-barlow font-bold text-2xl sm:text-3xl text-foreground mb-1">New Deals</h1>
            <p className="text-sm text-muted-foreground">Exclusive deals from providers in your network</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Network filter dropdown */}
            <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
              <SelectTrigger className="w-[180px] h-9 text-xs bg-background">
                <Globe className="h-3.5 w-3.5 mr-1.5 text-primary shrink-0" />
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">All Networks</SelectItem>
                {nearbyNetworks.map((network) => (
                  <SelectItem key={network.code} value={network.code}>
                    <div className="flex flex-col">
                      <span>{network.name}</span>
                      <span className="text-[10px] text-muted-foreground">{network.area}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
              <Store className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{filteredDeals.length} deals</span>
            </div>
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          </div>
        </div>

        {sortedDeals.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedDeals.map((deal) => (
                <Card key={deal.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-primary px-4 py-2 flex items-center justify-between">
                    <span className="text-primary-foreground font-bold text-lg">
                      {deal.discount}
                    </span>
                    {deal.featured && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Star className="h-3 w-3" /> Featured
                      </Badge>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="w-fit">{deal.category}</Badge>
                      <Badge variant="outline" className="w-fit text-[10px] text-muted-foreground">
                        {mockNetworks.find((n) => n.code === deal.networkCode)?.name}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold mb-1">{deal.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">{deal.description}</p>
                    <div className="space-y-1.5 text-sm text-muted-foreground mb-5">
                      <div className="flex items-center gap-2"><Store className="h-3.5 w-3.5" />{deal.provider}</div>
                      <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{deal.location}</div>
                      <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />Expires {new Date(deal.expiry).toLocaleDateString()}</div>
                    </div>
                    <Button className="w-full">Claim Deal</Button>
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
                        <TableHead className="text-[11px] cursor-pointer select-none" onClick={() => handleSort("featured")}>
                          Status <SortIcon column="featured" />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedDeals.map((deal) => (
                        <TableRow key={deal.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedDeal(deal)}>
                          <TableCell className="py-2">
                            <div className="text-xs text-muted-foreground line-clamp-1">{deal.title}</div>
                            <div className="font-semibold text-xs">{deal.description}</div>
                          </TableCell>
                          <TableCell className="text-xs py-2">{deal.provider}</TableCell>
                          <TableCell className="py-2"><Badge variant="outline" className="text-[10px]">{deal.category}</Badge></TableCell>
                          <TableCell className="py-2 whitespace-nowrap">
                            <Badge className="text-[10px]">{deal.discount}</Badge>
                            {sortKey === "discount" && (
                              <span className="block text-[9px] text-muted-foreground mt-0.5">{getDiscountType(deal.discount)}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs py-2 whitespace-nowrap">{new Date(deal.expiry).toLocaleDateString()}</TableCell>
                          <TableCell className="py-2">
                            {deal.featured && <Badge variant="secondary" className="text-[10px]"><Star className="h-2.5 w-2.5 mr-0.5" />Featured</Badge>}
                          </TableCell>
                        </TableRow>
                      ))}
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
          title={selectedDeal.title}
          description={selectedDeal.description}
          rows={[
            { label: "Provider", value: selectedDeal.provider },
            { label: "Category", value: selectedDeal.category },
            { label: "Discount", value: selectedDeal.discount },
            { label: "Location", value: selectedDeal.location },
            { label: "Network", value: mockNetworks.find((n) => n.code === selectedDeal.networkCode)?.name || selectedDeal.networkCode },
            { label: "Expires", value: new Date(selectedDeal.expiry).toLocaleDateString() },
            { label: "Featured", value: selectedDeal.featured ? "Yes" : "No" },
          ]}
          actions={<Button className="w-full">Claim Deal</Button>}
        />
      )}
    </DashboardLayout>
  );
};

export default NewDealsPage;
