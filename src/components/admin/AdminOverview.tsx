
import React from "react";
import { Card } from "@/components/ui/card";
import { Calendar, Users, Medal, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminOverview = () => {
  const navigate = useNavigate();

  const topNetworks = [
    { name: "Network Alpha", score: 950 },
    { name: "Network Beta", score: 920 },
    { name: "Network Gamma", score: 890 }
  ];

  const adminStats = [
    { 
      title: "Pending Events", 
      value: "5", 
      description: "Events awaiting approval",
      icon: Calendar,
      color: "bg-blue-100 text-blue-600", 
      path: "/dashboard/admin/pending" 
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      
      {/* Pending Events Summary */}
      <Card 
        className="p-6 cursor-pointer hover:shadow-md transition-all"
        onClick={() => navigate("/dashboard/admin/pending")}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg mb-2">Pending Events</h3>
            <p className="text-gray-500 text-sm">Review and approve upcoming events</p>
            <p className="text-royal font-medium mt-4">5 Pending Review</p>
          </div>
          <div className="rounded-full p-3 bg-blue-100 text-blue-600">
            <Calendar className="h-6 w-6" />
          </div>
        </div>
      </Card>

      {/* Admin Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {adminStats.map((stat, index) => (
          <Card 
            key={index}
            className="p-4 cursor-pointer hover:shadow-md transition-all"
            onClick={() => navigate(stat.path)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{stat.title}</p>
                <p className="text-sm text-gray-500">{stat.description}</p>
                <p className="text-royal font-medium mt-2">{stat.value}</p>
              </div>
              <div className={`rounded-full p-2 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Top Networks */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Medal className="h-5 w-5 text-royal" />
          <h2 className="text-lg font-semibold">Top Performing Networks</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topNetworks.map((network, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{network.name}</p>
                  <p className="text-sm text-gray-500">Score: {network.score}</p>
                </div>
                <div className="rounded-full p-2 bg-purple-100 text-purple-600">
                  <Users className="h-4 w-4" />
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
