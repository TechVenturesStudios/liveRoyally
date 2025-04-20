import { ReactNode } from "react";
import {
  User,
  Package,
  BarChart3,
  Calendar,
  PlusCircle,
  Clock,
  Medal,
  Users,
  Building
} from "lucide-react";
import { UserType } from "@/types/user";

export interface NavItem {
  name: string;
  icon: React.ComponentType<any>;
  path: string;
}

interface NavItemsByUserType {
  common: NavItem[];
  member: NavItem[];
  provider: NavItem[];
  partner: NavItem[];
  admin: NavItem[];
}

// Centralized navigation items by user type
const navigationItemsByType: NavItemsByUserType = {
  common: [
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
  ],
  
  member: [
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
  ],
  
  provider: [
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
  ],
  
  partner: [
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
  ],
  
  admin: [
    {
      name: "Pending Events",
      icon: Calendar,
      path: "/dashboard/admin/pending",
    },
    {
      name: "Historical Events",
      icon: Clock,
      path: "/dashboard/admin/history",
    },
    {
      name: "Network Analytics",
      icon: BarChart3,
      path: "/dashboard/admin/analytics",
    },
    {
      name: "Approve Events",
      icon: PlusCircle,
      path: "/dashboard/admin/approve",
    },
    {
      name: "Profile",
      icon: User,
      path: "/dashboard/admin/profile",
    }
  ]
};

export const getNavItems = (userType?: UserType): NavItem[] => {
  if (!userType) {
    return navigationItemsByType.common;
  }
  
  return [
    ...navigationItemsByType.common,
    ...navigationItemsByType[userType]
  ];
};
