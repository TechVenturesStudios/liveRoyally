
import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import VoucherWorkflow from "@/components/animations/VoucherWorkflow";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const VoucherWorkflowPage = () => {
  const { user, isLoading } = useAuthCheck();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <VoucherWorkflow />
    </DashboardLayout>
  );
};

export default VoucherWorkflowPage;
