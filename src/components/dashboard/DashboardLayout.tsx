
import React, { ReactNode } from "react";
import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "./DashboardSidebar";
import DashboardMobileNav from "./DashboardMobileNav";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuthCheck } from "@/hooks/useAuthCheck";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, isLoading } = useAuthCheck();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Only render dashboard if user exists
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <DashboardHeader user={user} />

      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar user={user} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6">{children}</main>
      </div>

      <DashboardMobileNav user={user} />
    </div>
  );
};

export default DashboardLayout;
