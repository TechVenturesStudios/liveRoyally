import type { NextApiRequest, NextApiResponse } from "next";
import { randomBytes } from "crypto";
import { prisma } from "../../lib/prisma";
import { resolveDashboardAccount } from "../../lib/dashboard-account";
import { getAppBaseUrl } from "../../lib/app-url";
import { queueReferralEmail } from "../../lib/notification-templates";

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const account = await resolveDashboardAccount(req, ["member"]);
  if (!account || "error" in account) return res.status(account && "error" in account ? account.status : 401).json({ error: account && "error" in account ? account.error : "Not authenticated" });

  if (req.method === "GET") {
    const [total, rewarded, member] = await Promise.all([
      prisma.referrals.count({ where: { referrer_id: account.actingUserId } }),
      prisma.referrals.count({ where: { referrer_id: account.actingUserId, status: "rewarded" } }),
      prisma.users.findUnique({ where: { user_id: account.actingUserId }, select: { first_name: true, last_name: true } }),
    ]);
    return res.status(200).json({ total, rewarded, pending: total - rewarded, referrerName: [member?.first_name, member?.last_name].filter(Boolean).join(" ").trim() || "Your friend" });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const inviteeEmail = cleanEmail(req.body?.inviteeEmail);
  if (!inviteeEmail || !/^\S+@\S+\.\S+$/.test(inviteeEmail)) return res.status(400).json({ error: "A valid invitee email is required" });
  if (inviteeEmail === (await prisma.users.findUnique({ where: { user_id: account.actingUserId }, select: { email: true } }))?.email.toLowerCase()) {
    return res.status(400).json({ error: "You cannot refer yourself" });
  }

  const existingUser = await prisma.users.findUnique({ where: { email: inviteeEmail }, select: { user_id: true } });
  if (existingUser) return res.status(409).json({ error: "That email already has a Local Metrics account" });

  const referral = await prisma.referrals.create({
    data: { referrer_id: account.actingUserId, invitee_email: inviteeEmail, referral_token: randomBytes(24).toString("base64url") },
    select: { referral_id: true, referral_token: true },
  });
  const referrer = await prisma.users.findUnique({ where: { user_id: account.actingUserId }, select: { first_name: true, last_name: true } });
  await queueReferralEmail({
    referralId: referral.referral_id,
    toEmail: inviteeEmail,
    referrerName: [referrer?.first_name, referrer?.last_name].filter(Boolean).join(" ").trim() || "Your friend",
    referralSignupLink: `${getAppBaseUrl(req)}/register?referral=${encodeURIComponent(referral.referral_token)}`,
  });
  return res.status(201).json({ referralId: referral.referral_id, referralLink: `${getAppBaseUrl(req)}/register?referral=${encodeURIComponent(referral.referral_token)}`, emailed: true });
}
