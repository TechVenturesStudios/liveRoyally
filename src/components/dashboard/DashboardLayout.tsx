
import React, { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, getUserFromStorage } from "@/utils/userStorage";
import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "./DashboardSidebar";
import DashboardMobileNav from "./DashboardMobileNav";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <DashboardHeader user={user!} />

      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar user={user!} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6">{children}</main>
      </div>

      <DashboardMobileNav user={user!} />
    </div>
  );
};

export default DashboardLayout;
