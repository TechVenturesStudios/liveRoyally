
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Medal } from "lucide-react";
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

const ProviderStatsCards = ({ provider, eventStats, networkScore }: ProviderStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Business Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16 border-2 border-royal">
              <AvatarFallback className="bg-royal text-white text-lg">
                {provider.businessName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-xl">{provider.businessName}</h3>
              <p className="text-gray-500">{provider.businessCategory}</p>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Contact:</span> {provider.businessEmail}</p>
            <p><span className="font-medium">Phone:</span> {provider.businessPhone}</p>
            <p><span className="font-medium">Location:</span> {provider.businessCity}, {provider.businessState}</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Participation Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Events</span>
              <Badge variant="outline" className="bg-amber-50">{eventStats.pending}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Historical Events</span>
              <Badge variant="outline" className="bg-blue-50">{eventStats.historical}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Upcoming Events</span>
              <Badge variant="outline" className="bg-green-50">{eventStats.upcoming}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Network Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="bg-royal/10 p-3 rounded-full">
              <Medal className="h-8 w-8 text-royal" />
            </div>
            <div>
              <p className="text-3xl font-bold text-royal">{networkScore}</p>
              <p className="text-gray-500 text-sm">Participation Points</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Level: Gold Provider</p>
            <p>Next level at: 1000 points</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderStatsCards;
