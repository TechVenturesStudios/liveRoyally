
import React from "react";
import { useNavigate } from "react-router-dom";
import { User as UserType } from "@/utils/userStorage";
import { UserType as UserTypeEnum } from "@/types/user";
import { getNavItems } from "@/utils/navigationItems";

interface DashboardMobileNavProps {
  user: UserType;
}

const DashboardMobileNav = ({ user }: DashboardMobileNavProps) => {
  const navigate = useNavigate();
  const navItems = getNavItems(user?.userType as UserTypeEnum);

  return (
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
  );
};

export default DashboardMobileNav;
