import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { resolveDashboardAccount } from "../../lib/dashboard-account";
import { getAppBaseUrl } from "../../lib/app-url";
import { offboardPartnerProviders } from "../../lib/partner-provider-offboarding";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const account = await resolveDashboardAccount(req, ["partner"]);
  if (!account || "error" in account) return res.status(account && "error" in account ? account.status : 401).json({ error: account && "error" in account ? account.error : "Not authenticated" });
  if (account.isRepresentative) return res.status(403).json({ error: "Authorized representatives cannot remove providers" });
  try {
    const providerId = String(req.body?.providerId || "").trim();
    const provider = await prisma.provider_profiles.findFirst({ where: { user_id: providerId, partner_id: account.actingUserId }, select: { user_id: true } });
    if (!provider) return res.status(404).json({ error: "Provider is not linked to this partner" });
    await offboardPartnerProviders({ partnerId: account.actingUserId, providerIds: [providerId], baseUrl: getAppBaseUrl(req) });
    return res.status(200).json({ removed: true });
  } catch (error) {
    console.error("remove-provider error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to remove provider" });
  }
}
