import { useEffect, useState } from "react";
import { getLoggedInMemberId } from "@/utils/memberAuth";

// ✅ replace if needed
const GET_MEMBER_UPCOMING_VOUCHERS_URL =
  "https://jcrjuefeoiktctyqbx4grvhosa0arwnt.lambda-url.us-east-2.on.aws/";

const GET_MEMBER_PURCHASE_HISTORY_URL =
  "https://t5r4e2q6tcoohvhzdiyu4vn6dq0vtvpk.lambda-url.us-east-2.on.aws/";

const GET_MEMBER_VOUCHERS_URL =
  "https://nvq4htz37wt6mnsid2nw6a6vc40kwmip.lambda-url.us-east-2.on.aws/";

const DEFAULT_STATS: Record<string, string> = {
  "Upcoming Vouchers": "…",
  "Purchase History": "…",
  "New Deals": "…",
};

export function useMemberDashboardStats(enabled: boolean) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Record<string, string>>(DEFAULT_STATS);

  useEffect(() => {
    if (!enabled) return;

    const load = async () => {
      // ✅ show placeholders immediately so UI never stays blank
      setStats(DEFAULT_STATS);

      const memberId = getLoggedInMemberId();
      if (!memberId) {
        setStats({
          "Upcoming Vouchers": "—",
          "Purchase History": "—",
          "New Deals": "—",
        });
        return;
      }

      setLoading(true);
      try {
        const [upcomingRes, historyRes, dealsRes] = await Promise.all([
          fetch(`${GET_MEMBER_UPCOMING_VOUCHERS_URL}?memberId=${encodeURIComponent(memberId)}`),
          fetch(`${GET_MEMBER_PURCHASE_HISTORY_URL}?memberId=${encodeURIComponent(memberId)}`),
          fetch(GET_MEMBER_VOUCHERS_URL),
        ]);

        const [upcomingJson, historyJson, dealsJson] = await Promise.all([
          upcomingRes.json().catch(() => ({})),
          historyRes.json().catch(() => ({})),
          dealsRes.json().catch(() => ({})),
        ]);

        const upcomingCount = Array.isArray(upcomingJson?.vouchers)
          ? upcomingJson.vouchers.filter((v: any) => String(v.status || "").toLowerCase() === "active").length
          : 0;

        const purchaseCount = Array.isArray(historyJson?.purchases)
          ? historyJson.purchases.length
          : 0;

        const dealsCount = Array.isArray(dealsJson?.vouchers)
          ? dealsJson.vouchers.filter((v: any) => String(v.status || "").toLowerCase() === "active").length
          : 0;

        setStats({
          "Upcoming Vouchers": `${upcomingCount} Active`,
          "Purchase History": `${purchaseCount} Total`,
          "New Deals": `${dealsCount} Available`,
        });
      } catch (e) {
        console.error("member dashboard stats failed:", e);
        setStats({
          "Upcoming Vouchers": "—",
          "Purchase History": "—",
          "New Deals": "—",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [enabled]);

  return { stats, loading };
}
