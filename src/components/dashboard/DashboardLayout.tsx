
import React, { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, getUserFromStorage } from "@/utils/userStorage";
import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "./DashboardSidebar";
import DashboardMobileNav from "./DashboardMobileNav";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "sonner";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for user in localStorage
    const userData = getUserFromStorage();
    console.log("User data from storage:", userData);
    
    if (!userData) {
      console.log("No user found, redirecting to login");
      toast.error("Please sign in to access the dashboard");
      navigate("/login");
      return;
    }
    
    // Small delay to ensure state updates properly
    setTimeout(() => {
      setUser(userData);
      setIsLoading(false);
    }, 100);
  }, [navigate]);

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
