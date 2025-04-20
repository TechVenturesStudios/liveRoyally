
import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AdminOverview from "@/components/admin/AdminOverview";

const AdminDashboard = () => {
  const { user, isLoading } = useAuthCheck();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user || user.userType !== "admin") {
    return null;
  }

  return (
    <DashboardLayout>
      <AdminOverview />
    </DashboardLayout>
  );
};

export default AdminDashboard;
