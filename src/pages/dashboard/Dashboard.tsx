
import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardWelcome from "@/components/dashboard/DashboardWelcome";
import DashboardCards from "@/components/dashboard/DashboardCards";
import VoucherWorkflow from "@/components/animations/VoucherWorkflow";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const Dashboard = () => {
  const { user, isLoading } = useAuthCheck();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <DashboardWelcome />
      <DashboardCards userType={user.userType} />
      <VoucherWorkflow />
    </DashboardLayout>
  );
};

export default Dashboard;
