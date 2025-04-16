
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { User } from "@/utils/userStorage";
import { removeUserFromStorage } from "@/utils/userStorage";

interface DashboardHeaderProps {
  user: User;
}

const DashboardHeader = ({ user }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    removeUserFromStorage();
    navigate("/login");
  };

  return (
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
  );
};

export default DashboardHeader;
