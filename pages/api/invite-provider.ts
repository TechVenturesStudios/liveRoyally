import type { NextApiRequest, NextApiResponse } from "next";
import { createHash } from "crypto";
import { prisma } from "../../lib/prisma";
import { resolveDashboardAccount } from "../../lib/dashboard-account";
import { getAppBaseUrl } from "../../lib/app-url";
import { queueProviderNetworkInvitationEmail } from "../../lib/notification-templates";

function normalize(value: unknown) {
  return String(value || "").trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const account = await resolveDashboardAccount(req, ["partner"]);
  if (!account || "error" in account) {
    return res.status(account && "error" in account ? account.status : 401).json({
      error: account && "error" in account ? account.error : "Not authenticated",
    });
  }

  try {
    const body = req.body ?? {};
    const businessName = normalize(body.businessName);
    const businessEmail = normalize(body.businessEmail).toLowerCase();
    if (!businessName || !businessEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail)) {
      return res.status(400).json({ error: "Business name and a valid business email are required" });
    }

    const [partner, subscription, provider] = await Promise.all([
      prisma.partner_profiles.findUnique({
        where: { user_id: account.actingUserId },
        select: { partner_code: true, org_name: true },
      }),
      prisma.partner_subscriptions.findFirst({
        where: { partner_id: account.actingUserId, status: "active" },
        orderBy: { created_at: "desc" },
        select: { max_providers: true },
      }),
      prisma.provider_profiles.findFirst({
        where: {
          partner_id: account.actingUserId,
          OR: [{ business_email: businessEmail }, { users: { email: businessEmail } }],
        },
        select: { user_id: true },
      }),
    ]);

    if (!partner?.partner_code) return res.status(422).json({ error: "Partner code is not configured" });
    if (!subscription) return res.status(403).json({ error: "Your subscription is not active. Please renew or upgrade to add providers." });
    if (provider) return res.status(409).json({ error: "This provider is already in your network" });

    const currentProviders = await prisma.provider_profiles.count({ where: { partner_id: account.actingUserId } });
    if (subscription.max_providers !== null && currentProviders >= subscription.max_providers) {
      return res.status(409).json({ error: `Your current plan allows ${subscription.max_providers} providers. Upgrade to add more.` });
    }

    const invitationId = createHash("sha256")
      .update(`${account.actingUserId}:${businessEmail}`)
      .digest("hex");
    const acceptInviteLink = `${getAppBaseUrl(req)}/register?network=live-royally&type=provider&partnerCode=${encodeURIComponent(partner.partner_code)}`;

    await queueProviderNetworkInvitationEmail({
      invitationId,
      toEmail: businessEmail,
      firstName: normalize(body.agentFirstName) || null,
      partnerName: partner.org_name?.trim() || "Your partner",
      partnerCode: partner.partner_code,
      acceptInviteLink,
    });

    return res.status(200).json({ invited: true });
  } catch (error) {
    console.error("invite-provider error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to send provider invite" });
  }
}
