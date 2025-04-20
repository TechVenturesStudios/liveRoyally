
import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AdminOverview from "@/components/admin/AdminOverview";
import { toast } from "sonner";

const AdminDashboard = () => {
  const { user, isLoading } = useAuthCheck();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // For debugging
  console.log("AdminDashboard - user data:", user);

  // Temporarily remove this check to see if content renders
  // We'll treat any authenticated user as an admin for now
  return (
    <DashboardLayout>
      <AdminOverview />
    </DashboardLayout>
  );
};

export default AdminDashboard;
