
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
            className="flex flex-col items-center py-1.5 px-2 text-[10px] text-gray-600 hover:text-royal"
            onClick={() => navigate(item.path)}
          >
            <item.icon className="h-4 w-4 mb-0.5" />
            <span className="whitespace-nowrap">{item.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardMobileNav;
