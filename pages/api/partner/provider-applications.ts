import type { NextApiRequest, NextApiResponse } from "next";
import { resolveDashboardAccount } from "../../../lib/dashboard-account";
import { prisma } from "../../../lib/prisma";
import { setCognitoTemporaryPassword } from "../../../lib/cognito-admin";
import {
  queueProviderApprovedEmail,
  queueProviderDeclinedEmail,
  queueTemporaryPasswordEmail,
  queueWelcomeEmail,
} from "../../../lib/notification-templates";

type Application = {
  id: string;
  businessName: string | null;
  businessCategory: string | null;
  businessEmail: string | null;
  businessPhone: string | null;
  agentFirstName: string | null;
  agentLastName: string | null;
  agentPhone: string | null;
  businessAddress: string | null;
  businessCity: string | null;
  businessState: string | null;
  businessZip: string | null;
  submittedAt: string | null;
};

function toApplication(provider: any): Application {
  return {
    id: provider.users.user_id,
    businessName: provider.business_name,
    businessCategory: provider.business_category,
    businessEmail: provider.business_email || provider.users.email,
    businessPhone: provider.business_phone,
    agentFirstName: provider.agent_first_name,
    agentLastName: provider.agent_last_name,
    agentPhone: provider.agent_phone,
    businessAddress: provider.business_address,
    businessCity: provider.business_city,
    businessState: provider.business_state,
    businessZip: provider.business_zip,
    submittedAt: provider.created_at?.toISOString() ?? null,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const account = await resolveDashboardAccount(req, ["partner"]);
  if (!account || "error" in account) {
    return res.status(account && "error" in account ? account.status : 401).json({
      error: account && "error" in account ? account.error : "Not authenticated",
    });
  }
  if (account.isRepresentative) {
    return res.status(403).json({ error: "Authorized representatives cannot approve providers" });
  }

  try {
    if (req.method === "GET") {
      const applications = await prisma.provider_profiles.findMany({
        where: { partner_id: account.actingUserId, application_status: "pending" },
        orderBy: { created_at: "asc" },
        select: {
          business_name: true, business_category: true, business_email: true, business_phone: true,
          agent_first_name: true, agent_last_name: true, agent_phone: true,
          business_address: true, business_city: true, business_state: true, business_zip: true,
          created_at: true,
          users: { select: { user_id: true, email: true } },
        },
      });
      return res.status(200).json({ applications: applications.map(toApplication) });
    }

    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const providerId = String(req.body?.providerId || "").trim();
    const action = String(req.body?.action || "").trim().toLowerCase();
    if (!providerId || !["approve", "decline"].includes(action)) {
      return res.status(400).json({ error: "providerId and action (approve or decline) are required" });
    }

    const provider = await prisma.provider_profiles.findFirst({
      where: { user_id: providerId, partner_id: account.actingUserId },
      select: {
        user_id: true, application_status: true, approval_email_sent_at: true,
        users: { select: { email: true, first_name: true } },
      },
    });
    if (!provider) return res.status(404).json({ error: "Provider application not found" });
    if (provider.application_status !== "pending") {
      return res.status(200).json({ providerId, status: provider.application_status, alreadyHandled: true });
    }

    const partner = await prisma.partner_profiles.findUnique({
      where: { user_id: account.actingUserId },
      select: { org_name: true },
    });
    const partnerName = partner?.org_name?.trim() || "Your partner";
    const now = new Date();

    if (action === "approve") {
      await prisma.provider_profiles.update({
        where: { user_id: provider.user_id },
        data: { application_status: "active", approved_at: now, declined_at: null },
      });
      const temporaryPassword = await setCognitoTemporaryPassword(provider.users.email);
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://liveroyally.com";
      await Promise.all([
        queueTemporaryPasswordEmail({ email: provider.users.email, temporaryPassword, userType: "provider", idempotencyKey: `provider-temporary-password:${provider.user_id}:${now.toISOString()}` }),
        queueProviderApprovedEmail({ providerId: provider.user_id, toEmail: provider.users.email, firstName: provider.users.first_name, partnerName, loginLink: `${baseUrl}/login`, applicationKey: now.toISOString() }),
        queueWelcomeEmail(provider.user_id, "provider"),
      ]);
      await prisma.provider_profiles.update({ where: { user_id: provider.user_id }, data: { approval_email_sent_at: now } });
      return res.status(200).json({ providerId, status: "active" });
    }

    await prisma.provider_profiles.update({
      where: { user_id: provider.user_id },
      data: { application_status: "declined", declined_at: now },
    });
    await queueProviderDeclinedEmail({
      providerId: provider.user_id,
      toEmail: provider.users.email,
      firstName: provider.users.first_name,
      partnerName,
      supportEmail: process.env.SUPPORT_EMAIL || process.env.SES_FROM_EMAIL || "support@localmetrics.com",
      applicationKey: now.toISOString(),
    });
    return res.status(200).json({ providerId, status: "declined" });
  } catch (error) {
    console.error("provider application action error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update provider application" });
  }
}
