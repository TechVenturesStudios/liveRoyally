import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { resolveDashboardAccount } from "../../lib/dashboard-account";
import { getAppBaseUrl } from "../../lib/app-url";
import { queueProviderRemovedEmail } from "../../lib/notification-templates";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const account = await resolveDashboardAccount(req, ["partner"]);
  if (!account || "error" in account) return res.status(account && "error" in account ? account.status : 401).json({ error: account && "error" in account ? account.error : "Not authenticated" });
  try {
    const providerId = String(req.body?.providerId || "").trim();
    const provider = await prisma.provider_profiles.findFirst({ where: { user_id: providerId, partner_id: account.actingUserId }, select: { user_id: true, business_email: true, users: { select: { email: true, first_name: true }, }, } });
    if (!provider) return res.status(404).json({ error: "Provider is not linked to this partner" });
    const partner = await prisma.users.findUnique({ where: { user_id: account.actingUserId }, select: { email: true, partner_profiles: { select: { org_name: true } } } });
    await prisma.provider_profiles.update({ where: { user_id: providerId }, data: { partner_id: null } });
    const recipientEmail = provider.business_email?.trim() || provider.users.email;
    await queueProviderRemovedEmail({ providerId, toEmail: recipientEmail, firstName: provider.users.first_name, partnerName: partner?.partner_profiles?.org_name?.trim() || "Your partner", lrnJoinLink: `${getAppBaseUrl(req)}/join-network`, supportEmail: process.env.SUPPORT_EMAIL || process.env.SES_FROM_EMAIL || "support@localmetrics.com" });
    return res.status(200).json({ removed: true });
  } catch (error) {
    console.error("remove-provider error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to remove provider" });
  }
}
