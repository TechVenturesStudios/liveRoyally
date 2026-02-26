
import React from "react";
import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardWelcome from "@/components/dashboard/DashboardWelcome";
import DashboardCards from "@/components/dashboard/DashboardCards";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const Dashboard = () => {
  const { user, isLoading } = useAuthCheck();

  if (isLoading) return <LoadingSpinner />;
  if (!user) return null;

  // Each role gets redirected to their specific landing page
  switch (user.userType) {
    case "partner":
      return <Navigate to="/dashboard/crm" replace />;
    case "admin":
      return <Navigate to="/dashboard/admin" replace />;
    case "provider":
      return <Navigate to="/dashboard/providers" replace />;
    case "member":
    default:
      // Members land on the generic dashboard with welcome + cards
      return (
        <DashboardLayout>
          <DashboardWelcome />
          <DashboardCards userType={user.userType} />
        </DashboardLayout>
      );
  }
};

export default Dashboard;
