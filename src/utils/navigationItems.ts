
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
  Building,
  MessageSquare,
  Link,
  LayoutDashboard,
  Crown,
  ScanLine
} from "lucide-react";
import { UserType } from "@/types/user";

export interface NavItem {
  name: string;
  shortName?: string;
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

const navigationItemsByType: NavItemsByUserType = {
  common: [],
  
  member: [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      name: "Vouchers",
      icon: Package,
      path: "/dashboard/vouchers",
    },
    {
      name: "Purchase History",
      shortName: "History",
      icon: Clock,
      path: "/dashboard/history",
    },
    {
      name: "New Deals",
      shortName: "Deals",
      icon: PlusCircle,
      path: "/dashboard/deals",
    },
    {
      name: "Engagement Score",
      shortName: "Score",
      icon: Medal,
      path: "/dashboard/score",
    },
  ],
  
  provider: [
    {
      name: "Provider CRM",
      shortName: "CRM",
      icon: Crown,
      path: "/dashboard/providers",
    },
    {
      name: "Events Management",
      shortName: "Events",
      icon: Calendar,
      path: "/dashboard/providers/events",
    },
    {
      name: "Pending Events",
      shortName: "Pending",
      icon: Clock,
      path: "/dashboard/pending-events",
    },
    {
      name: "Representatives",
      shortName: "Reps",
      icon: Users,
      path: "/dashboard/providers/representatives",
    },
    {
      name: "Engagement Score",
      shortName: "Score",
      icon: Medal,
      path: "/dashboard/score",
    },
    {
      name: "Scan QR Code",
      shortName: "Scan",
      icon: ScanLine,
      path: "/dashboard/vouchers",
    },
  ],
  
  partner: [
    {
      name: "Partner CRM",
      shortName: "CRM",
      icon: Crown,
      path: "/dashboard/crm",
    },
    {
      name: "My Providers",
      shortName: "Providers",
      icon: Building,
      path: "/dashboard/my-providers",
    },
    {
      name: "Event Analytics",
      shortName: "Analytics",
      icon: BarChart3,
      path: "/dashboard/analytics",
    },
    {
      name: "Engagement Score",
      shortName: "Score",
      icon: Medal,
      path: "/dashboard/score",
    },
    {
      name: "Create Event",
      shortName: "Create",
      icon: PlusCircle,
      path: "/dashboard/create-event",
    },
    {
      name: "Representatives",
      shortName: "Reps",
      icon: Users,
      path: "/dashboard/partner/representatives",
    },
  ],
  
  admin: [
    {
      name: "Home",
      icon: Crown,
      path: "/dashboard/admin/profile",
    },
    {
      name: "Pending Partners",
      shortName: "Pending",
      icon: Building,
      path: "/dashboard/admin/pending-partners",
    },
    {
      name: "Network Analytics",
      shortName: "Analytics",
      icon: BarChart3,
      path: "/dashboard/admin/analytics",
    },
    {
      name: "Historical Events",
      shortName: "History",
      icon: Clock,
      path: "/dashboard/admin/history",
    },
    {
      name: "Representatives",
      shortName: "Reps",
      icon: Users,
      path: "/dashboard/admin/representatives",
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
