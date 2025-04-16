
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

export const getNavItems = (userType?: UserType): NavItem[] => {
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
