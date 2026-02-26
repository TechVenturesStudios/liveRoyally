
import { 
  Package, 
  Calendar, 
  Clock, 
  BarChart3, 
  PlusCircle,
  Medal,
  Users,
  Building,
  MessageSquare,
  Link
} from "lucide-react";
import { UserType } from "@/types/user";

export interface DashboardCardItem {
  title: string;
  description: string;
  icon: any;
  path: string;
  color: string;
  stats?: string;
}

interface CardItemsByUserType {
  member: DashboardCardItem[];
  provider: DashboardCardItem[];
  partner: DashboardCardItem[];
  admin: DashboardCardItem[];
}

export const dashboardCardItems: CardItemsByUserType = {
  member: [
    {
      title: "Upcoming Vouchers",
      description: "View your purchased vouchers",
      icon: Package,
      path: "/dashboard/vouchers",
      color: "bg-blue-100 text-blue-600",
      stats: "..."
    },
    {
      title: "Purchase History",
      description: "View your past purchases",
      icon: Clock,
      path: "/dashboard/history",
      color: "bg-amber-100 text-amber-600",
      stats: "..."
    },
    {
      title: "New Deals",
      description: "Discover new offers and deals",
      icon: PlusCircle,
      path: "/dashboard/deals",
      color: "bg-green-100 text-green-600",
      stats: "..."
    },
    {
      title: "Engagement Score",
      description: "View your engagement metrics",
      icon: Medal,
      path: "/dashboard/score",
      color: "bg-purple-100 text-purple-600",
      stats: "..."
    }
  ],
  provider: [
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
  ],
  partner: [
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
      title: "Provider CRM",
      description: "Manage provider relationships",
      icon: MessageSquare,
      path: "/dashboard/crm",
      color: "bg-purple-100 text-purple-600",
      stats: "24 Providers"
    }
  ],
  admin: [
    {
      title: "Pending Events",
      description: "Events awaiting approval",
      icon: Calendar,
      path: "/dashboard/admin/pending",
      color: "bg-blue-100 text-blue-600",
      stats: "5 Pending"
    },
    {
      title: "Historical Events",
      description: "View all past events",
      icon: Clock,
      path: "/dashboard/admin/history",
      color: "bg-amber-100 text-amber-600",
      stats: "24 Published"
    },
    {
      title: "Network Analytics",
      description: "View performance metrics",
      icon: BarChart3,
      path: "/dashboard/admin/analytics",
      color: "bg-green-100 text-green-600",
      stats: "3 Networks"
    },
    {
      title: "Event Approval",
      description: "Review and publish events",
      icon: PlusCircle,
      path: "/dashboard/admin/approve",
      color: "bg-purple-100 text-purple-600",
      stats: "5 Pending"
    }
  ]
};

export const getDashboardCards = (userType: UserType) => {
  return dashboardCardItems[userType] || [];
};
