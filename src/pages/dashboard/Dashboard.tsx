
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardWelcome from "@/components/dashboard/DashboardWelcome";
import DashboardCards from "@/components/dashboard/DashboardCards";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { fetchMemberNetworkVouchers, fetchMemberVouchers } from "@/api/memberVouchers";
import { fetchMemberPurchaseHistory } from "@/api/memberPurchases";
import { isVoucherExpired } from "@/utils/memberVoucherFormatting";

const Dashboard = () => {
  const { user, isLoading } = useAuthCheck();
  const [memberCardStats, setMemberCardStats] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user || user.userType !== "member") {
      setMemberCardStats({});
      return;
    }

    let cancelled = false;

    const loadMemberStats = async () => {
      try {
        const [voucherResult, dealResult, purchaseResult] = await Promise.allSettled([
          fetchMemberVouchers(),
          fetchMemberNetworkVouchers(),
          fetchMemberPurchaseHistory(),
        ]);

        if (cancelled) return;

        const activeVoucherCount =
          voucherResult.status === "fulfilled"
            ? voucherResult.value.vouchers.filter((voucher) => {
                const status = String(voucher.status || "").trim().toLowerCase();
                return status !== "claimed" && status !== "expired" && !isVoucherExpired(voucher);
              }).length
            : 0;

        const availableDealCount =
          dealResult.status === "fulfilled"
            ? dealResult.value.vouchers.filter((voucher) => {
                const status = String(voucher.status || "").trim().toLowerCase();
                return status !== "claimed" && status !== "expired" && !isVoucherExpired(voucher);
              }).length
            : 0;

        const purchaseCount = purchaseResult.status === "fulfilled" ? purchaseResult.value.purchases.length : 0;

        setMemberCardStats({
          "Upcoming Vouchers": `${activeVoucherCount} Active`,
          "Purchase History": `${purchaseCount} total`,
          "New Deals": `${availableDealCount} available`,
        });
      } catch (error) {
        console.error("failed to load member dashboard stats:", error);
        if (!cancelled) {
          setMemberCardStats({
            "Purchase History": "0 total",
          });
        }
      }
    };

    loadMemberStats();

    return () => {
      cancelled = true;
    };
  }, [user]);

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
          <DashboardCards userType={user.userType} statsOverrides={memberCardStats} />
        </DashboardLayout>
      );
  }
};

export default Dashboard;
