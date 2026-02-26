
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Medal, Users, Ticket, Tag } from "lucide-react";
import { ProviderUser } from "@/types/user";

interface ProviderStatsCardsProps {
  provider: ProviderUser;
  eventStats: {
    pending: number;
    historical: number;
    upcoming: number;
  };
  networkScore: number;
}

// Mock voucher/member data — in production this comes from the DB
const mockNetworkStats = {
  totalMembers: 342,
  totalVouchersUsed: 1_287,
  dealBreakdown: [
    { type: "% Off", count: 514, color: "bg-primary/10 text-primary" },
    { type: "$ Off", count: 389, color: "bg-accent/60 text-accent-foreground" },
    { type: "Free Item", count: 248, color: "bg-secondary text-secondary-foreground" },
    { type: "BOGO", count: 136, color: "bg-muted text-muted-foreground" },
  ],
};

const ProviderStatsCards = ({ provider, eventStats, networkScore }: ProviderStatsCardsProps) => {
  const { totalMembers, totalVouchersUsed, dealBreakdown } = mockNetworkStats;

  return (
    <>
      {/* Mobile: compact horizontal stats */}
      <div className="flex sm:hidden gap-1.5 mb-4 flex-wrap">
        <div className="flex-1 min-w-[70px] px-2 py-1.5 rounded-md bg-muted/50 text-left">
          <p className="text-[9px] font-medium text-muted-foreground truncate">{provider.businessName}</p>
          <p className="text-xs font-bold">{provider.businessCategory}</p>
        </div>
        <div className="flex-1 min-w-[60px] px-2 py-1.5 rounded-md bg-primary/5 text-left">
          <p className="text-[9px] font-medium text-muted-foreground truncate">Members</p>
          <p className="text-xs font-bold">{totalMembers}</p>
        </div>
        <div className="flex-1 min-w-[60px] px-2 py-1.5 rounded-md bg-primary/10 text-left">
          <p className="text-[9px] font-medium text-muted-foreground truncate">Vouchers</p>
          <p className="text-xs font-bold">{totalVouchersUsed}</p>
        </div>
        <div className="flex-1 min-w-[60px] flex items-center gap-1 px-2 py-1.5 rounded-md bg-primary/5 text-left">
          <Medal className="h-3 w-3 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] font-medium text-muted-foreground truncate">Score</p>
            <p className="text-xs font-bold">{networkScore}</p>
          </div>
        </div>
      </div>

      {/* Desktop: full cards */}
      <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Business Profile */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Business Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-12 w-12 border-2 border-primary">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {provider.businessName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="font-barlow font-bold text-base truncate">{provider.businessName}</h3>
                <p className="text-muted-foreground text-sm">{provider.businessCategory}</p>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Partner:</span> {provider.partnerName}</p>
              <p><span className="font-medium">Location:</span> {provider.businessCity}, {provider.businessState}</p>
            </div>
          </CardContent>
        </Card>

        {/* Network Members */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Network Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalMembers.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">Members in your network</p>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Pending Events</span>
                <Badge variant="outline">{eventStats.pending}</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Upcoming Events</span>
                <Badge variant="outline">{eventStats.upcoming}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voucher Usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Ticket className="h-4 w-4 text-primary" /> Voucher Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalVouchersUsed.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">Total vouchers redeemed</p>
            <div className="mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Tag className="h-3 w-3" /> Deal Types
              </p>
              <div className="space-y-1.5">
                {dealBreakdown.map((deal) => (
                  <div key={deal.type} className="flex items-center justify-between">
                    <Badge variant="secondary" className={`text-[10px] ${deal.color}`}>
                      {deal.type}
                    </Badge>
                    <span className="text-sm font-medium">{deal.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Medal className="h-4 w-4 text-primary" /> Network Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{networkScore}</p>
            <p className="text-sm text-muted-foreground mt-1">Participation Points</p>
            <div className="mt-3 text-sm text-muted-foreground space-y-1">
              <p>Level: Gold Provider</p>
              <p>Next level at: 1,000 pts</p>
              <p>Historical Events: {eventStats.historical}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ProviderStatsCards;
