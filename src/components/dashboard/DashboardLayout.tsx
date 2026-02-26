
import React, { ReactNode, useState } from "react";
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = sessionStorage.getItem("sidebar-collapsed");
    return stored === "true";
  });

  const updateCollapsed = (value: boolean) => {
    setSidebarCollapsed(value);
    sessionStorage.setItem("sidebar-collapsed", String(value));
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <DashboardHeader user={user} />

      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar
          user={user}
          collapsed={sidebarCollapsed}
          onToggle={() => updateCollapsed(!sidebarCollapsed)}
          onCollapse={() => updateCollapsed(true)}
        />

        <main
          className="flex-1 overflow-y-auto p-3 sm:p-6 pb-20 md:pb-6"
          onClick={() => { if (!sidebarCollapsed) updateCollapsed(true); }}
        >
          {children}
        </main>
      </div>

      <DashboardMobileNav user={user} />
    </div>
  );
};

export default DashboardLayout;
