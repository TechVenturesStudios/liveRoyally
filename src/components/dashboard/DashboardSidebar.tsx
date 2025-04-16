
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import { User } from "@/utils/userStorage";
import { UserType } from "@/types/user";
import { getNavItems } from "@/utils/navigationItems";

interface DashboardSidebarProps {
  user: User;
}

const DashboardSidebar = ({ user }: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const navItems = getNavItems(user?.userType as UserType);

  return (
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
  );
};

export default DashboardSidebar;
