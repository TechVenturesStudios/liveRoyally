// src/pages/RoleRouter.tsx
import React from "react";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

import Dashboard from "./dashboard/Dashboard";
import ProvidersDashboard from "./dashboard/ProvidersDashboard";
import PartnersDashboard from "./dashboard/PartnersDashboard";
import AdminDashboard from "./dashboard/AdminDashboard";

const RoleRouter = () => {
  const { user, isLoading } = useAuthCheck();

  if (isLoading) return <LoadingSpinner />;
  if (!user) return null;

  switch (user.userType) {
    case "member":
      return <Dashboard />;

    case "provider":
      return <ProvidersDashboard />;

    case "partner":
      return <PartnersDashboard />;

    case "admin":
      return <AdminDashboard />;

    default:
      return <Dashboard />;
  }
};

export default RoleRouter;
