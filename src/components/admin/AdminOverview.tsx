
import React from "react";
import { Card } from "@/components/ui/card";
import { Calendar, Users, Medal, BarChart3, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminOverview = () => {
  const navigate = useNavigate();

  const topNetworks = [
    { name: "Network Alpha", score: 950, code: "ROYAL1" },
    { name: "Network Beta", score: 920, code: "METRO1" },
    { name: "Network Gamma", score: 890, code: "WEST1" }
  ];

  const adminStats = [
    { 
      title: "Pending Partners", 
      value: "3", 
      description: "Partner applications to review",
      icon: Users,
      color: "bg-purple-100 text-purple-600", 
      path: "/dashboard/admin/pending-partners" 
    },
    { 
      title: "Historical Events", 
      value: "24", 
      description: "All published events",
      icon: Clock, 
      color: "bg-amber-100 text-amber-600", 
      path: "/dashboard/admin/history" 
    },
    { 
      title: "Network Analytics", 
      value: "3", 
      description: "Active networks",
      icon: BarChart3, 
      color: "bg-green-100 text-green-600", 
      path: "/dashboard/admin/analytics" 
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-barlow font-bold">Admin Dashboard</h1>
      
      {/* Pending Partners Summary */}
      <Card 
        className="p-3 sm:p-6 cursor-pointer hover:shadow-md transition-all"
        onClick={() => navigate("/dashboard/admin/pending-partners", { state: { from: "/dashboard/admin/profile" } })}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-barlow font-bold text-sm sm:text-lg mb-1 sm:mb-2">Pending Partners</h3>
            <p className="text-muted-foreground text-xs sm:text-sm">Review and approve partner applications</p>
            <p className="text-primary font-medium text-sm sm:text-base mt-2 sm:mt-4">3 Awaiting Approval</p>
          </div>
          <div className="rounded-full p-2 sm:p-3 bg-purple-100 text-purple-600">
            <Users className="h-4 w-4 sm:h-6 sm:w-6" />
          </div>
        </div>
      </Card>

      {/* Admin Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {adminStats.map((stat, index) => (
          <Card 
            key={index}
            className="p-2.5 sm:p-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => navigate(stat.path, { state: { from: "/dashboard/admin/profile" } })}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <div className="min-w-0">
                <p className="font-medium text-xs sm:text-sm truncate">{stat.title}</p>
                <p className="text-[10px] sm:text-sm text-gray-500 hidden sm:block">{stat.description}</p>
                <p className="text-royal font-medium text-sm sm:text-base mt-1 sm:mt-2">{stat.value}</p>
              </div>
              <div className={`rounded-full p-1.5 sm:p-2 ${stat.color} shrink-0`}>
                <stat.icon className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Top Networks */}
      <div>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-royal" />
          <h2 className="text-sm sm:text-lg font-barlow font-bold">Top Performing Networks</h2>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {topNetworks.map((network, index) => (
            <Card 
              key={index} 
              className="p-2.5 sm:p-4 cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigate(`/dashboard/admin/network/${network.code}`, { state: { from: "/dashboard/admin/profile" } })}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                <div className="min-w-0">
                  <p className="font-medium text-xs sm:text-sm truncate">{network.name}</p>
                  <p className="text-[10px] sm:text-sm text-gray-500">Score: {network.score}</p>
                </div>
                <div className="rounded-full p-1.5 sm:p-2 bg-purple-100 text-purple-600 shrink-0">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
