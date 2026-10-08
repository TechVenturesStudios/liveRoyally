import type { NextApiRequest, NextApiResponse } from "next";
import { getAppBaseUrl } from "../../lib/app-url";
import { resolveDashboardAccount } from "../../lib/dashboard-account";
import { queueMemberPointsTierGuideEmail } from "../../lib/notification-templates";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const account = await resolveDashboardAccount(req, ["member"]);
  if (!account || "error" in account) {
    return res.status(account && "error" in account ? account.status : 401).json({
      error: account && "error" in account ? account.error : "Not authenticated",
    });
  }

  try {
    const job = await queueMemberPointsTierGuideEmail({
      userId: account.actingUserId,
      dashboardLink: `${getAppBaseUrl(req)}/dashboard`,
    });

    if (!job) return res.status(422).json({ error: "Member email address is not available" });
    return res.status(200).json({ queued: true });
  } catch (error) {
    console.error("send-points-tier-guide error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to queue points guide email" });
  }
}
