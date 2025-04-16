
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { UserType } from "@/types/user";
import { 
  Package, 
  Calendar, 
  Clock, 
  BarChart3, 
  PlusCircle,
  Medal
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        setUser(JSON.parse(userJson));
      } catch (e) {
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  if (!user) {
    return null;
  }

  // Generate cards based on user type
  const getDashboardCards = (userType: UserType) => {
    switch (userType) {
      case "member":
        return [
          {
            title: "Upcoming Vouchers",
            description: "View your purchased vouchers",
            icon: Package,
            path: "/dashboard/vouchers",
            color: "bg-blue-100 text-blue-600",
            stats: "2 Active"
          },
          {
            title: "Purchase History",
            description: "View your past purchases",
            icon: Clock,
            path: "/dashboard/history",
            color: "bg-amber-100 text-amber-600",
            stats: "5 Total"
          },
          {
            title: "New Deals",
            description: "Discover new offers and deals",
            icon: PlusCircle,
            path: "/dashboard/deals",
            color: "bg-green-100 text-green-600",
            stats: "8 Available"
          },
          {
            title: "Engagement Score",
            description: "View your engagement metrics",
            icon: Medal,
            path: "/dashboard/score",
            color: "bg-purple-100 text-purple-600",
            stats: "850 Points"
          }
        ];
      case "provider":
        return [
          {
            title: "Pending Events",
            description: "Events you're participating in",
            icon: Calendar,
            path: "/dashboard/pending-events",
            color: "bg-blue-100 text-blue-600",
            stats: "3 Pending"
          },
          {
            title: "Participation History",
            description: "Events you've participated in",
            icon: Clock,
            path: "/dashboard/participated-events",
            color: "bg-amber-100 text-amber-600",
            stats: "12 Events"
          },
          {
            title: "Upcoming Events",
            description: "Join new network events",
            icon: PlusCircle,
            path: "/dashboard/upcoming-events",
            color: "bg-green-100 text-green-600",
            stats: "5 Available"
          },
          {
            title: "Network Score",
            description: "Your network participation metrics",
            icon: Medal,
            path: "/dashboard/score",
            color: "bg-purple-100 text-purple-600",
            stats: "1250 Points"
          }
        ];
      case "partner":
        return [
          {
            title: "Pending Events",
            description: "Events awaiting approval",
            icon: Calendar,
            path: "/dashboard/pending-events",
            color: "bg-blue-100 text-blue-600",
            stats: "2 Pending"
          },
          {
            title: "Published Events",
            description: "Your past published events",
            icon: Clock,
            path: "/dashboard/published-events",
            color: "bg-amber-100 text-amber-600",
            stats: "8 Published"
          },
          {
            title: "Create Event",
            description: "Create a new network event",
            icon: PlusCircle,
            path: "/dashboard/create-event",
            color: "bg-green-100 text-green-600",
            stats: ""
          },
          {
            title: "Analytics",
            description: "View network engagement metrics",
            icon: BarChart3,
            path: "/dashboard/analytics",
            color: "bg-purple-100 text-purple-600",
            stats: "320 Purchases"
          }
        ];
      case "admin":
        return [
          {
            title: "Pending Events",
            description: "Events awaiting your approval",
            icon: Calendar,
            path: "/dashboard/pending-events",
            color: "bg-blue-100 text-blue-600",
            stats: "5 Pending"
          },
          {
            title: "All Events",
            description: "View all published events",
            icon: Clock,
            path: "/dashboard/all-events",
            color: "bg-amber-100 text-amber-600",
            stats: "24 Total"
          },
          {
            title: "Approve Events",
            description: "Review and publish events",
            icon: PlusCircle,
            path: "/dashboard/approve-events",
            color: "bg-green-100 text-green-600",
            stats: "3 To Review"
          },
          {
            title: "Analytics",
            description: "Global engagement metrics",
            icon: BarChart3,
            path: "/dashboard/analytics",
            color: "bg-purple-100 text-purple-600",
            stats: "1,250 Engagements"
          }
        ];
      default:
        return [];
    }
  };

  const dashboardCards = getDashboardCards(user.userType);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold royal-header">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome to your Live Royally dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardCards.map((card, index) => (
          <Card 
            key={index} 
            className="p-6 cursor-pointer hover:shadow-md transition-all"
            onClick={() => navigate(card.path)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg mb-2">{card.title}</h3>
                <p className="text-gray-500 text-sm">{card.description}</p>
                {card.stats && (
                  <p className="text-royal font-medium mt-4">{card.stats}</p>
                )}
              </div>
              <div className={`rounded-full p-3 ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
