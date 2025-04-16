import React, { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import {
  Crown,
  LogOut,
  User,
  Package,
  BarChart3,
  Calendar,
  PlusCircle,
  Clock,
  Medal,
} from "lucide-react";
import { UserType } from "@/types/user";

interface DashboardLayoutProps {
  children: ReactNode;
}

// Mock user data until we have a real auth system
const getUserFromStorage = () => {
  const userJson = localStorage.getItem("user");
  if (userJson) {
    try {
      return JSON.parse(userJson);
    } catch (e) {
      return null;
    }
  }
  return null;
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = getUserFromStorage();
    if (!userData) {
      navigate("/login");
      return;
    }
    setUser(userData);
    setIsLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-royal"></div>
      </div>
    );
  }

  const getNavItems = (userType: UserType) => {
    const commonItems = [
      {
        name: "Profile",
        icon: User,
        path: "/dashboard/profile",
      },
      {
        name: "Engagement Score",
        icon: Medal,
        path: "/dashboard/score",
      },
    ];

    switch (userType) {
      case "member":
        return [
          ...commonItems,
          {
            name: "Upcoming Vouchers",
            icon: Package,
            path: "/dashboard/vouchers",
          },
          {
            name: "Purchase History",
            icon: Clock,
            path: "/dashboard/history",
          },
          {
            name: "New Deals",
            icon: PlusCircle,
            path: "/dashboard/deals",
          },
        ];
      case "provider":
        return [
          ...commonItems,
          {
            name: "Pending Events",
            icon: Calendar,
            path: "/dashboard/pending-events",
          },
          {
            name: "Participated Events",
            icon: Clock,
            path: "/dashboard/participated-events",
          },
          {
            name: "Upcoming Events",
            icon: PlusCircle,
            path: "/dashboard/upcoming-events",
          },
        ];
      case "partner":
        return [
          ...commonItems,
          {
            name: "Pending Events",
            icon: Calendar,
            path: "/dashboard/pending-events",
          },
          {
            name: "Published Events",
            icon: Clock,
            path: "/dashboard/published-events",
          },
          {
            name: "Create Event",
            icon: PlusCircle,
            path: "/dashboard/create-event",
          },
          {
            name: "Event Analytics",
            icon: BarChart3,
            path: "/dashboard/analytics",
          },
        ];
      case "admin":
        return [
          ...commonItems,
          {
            name: "Pending Events",
            icon: Calendar,
            path: "/dashboard/pending-events",
          },
          {
            name: "All Events",
            icon: Clock,
            path: "/dashboard/all-events",
          },
          {
            name: "Approve Events",
            icon: PlusCircle,
            path: "/dashboard/approve-events",
          },
          {
            name: "Analytics",
            icon: BarChart3,
            path: "/dashboard/analytics",
          },
        ];
      default:
        return commonItems;
    }
  };

  const navItems = user?.userType ? getNavItems(user.userType) : [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Logo />
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-sm">
              <span className="text-gray-500">Welcome, </span>
              <span className="font-medium">{user?.email || "User"}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-1 text-gray-600 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex md:w-64 lg:w-72 border-r border-gray-200 bg-white flex-col">
          <div className="flex-1 p-4 flex flex-col gap-1">
            <div className="py-3 px-4 mb-2 flex items-center gap-3 bg-royal/5 rounded-md">
              <div className="h-8 w-8 rounded-full bg-royal flex items-center justify-center text-white">
                <Crown className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">{user?.id || "User ID"}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.userType || "Member"}
                </p>
              </div>
            </div>
            <div className="space-y-1 pt-2">
              {navItems.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  className="w-full justify-start font-medium text-gray-600 hover:text-royal hover:bg-royal/5"
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.name}
                </Button>
              ))}
            </div>
          </div>
        </aside>

        {/* Mobile Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
          <div className="flex justify-around">
            {navItems.slice(0, 5).map((item) => (
              <button
                key={item.name}
                className="flex flex-col items-center py-2 px-3 text-xs text-gray-600 hover:text-royal"
                onClick={() => navigate(item.path)}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
