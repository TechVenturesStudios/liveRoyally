import type { NextApiRequest, NextApiResponse } from "next";
import { PartnerSubscriptionStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { resolveDashboardAccount } from "../../lib/dashboard-account";
import { setSquareSubscriptionCanceledDate } from "../../lib/square-partner-billing";

const dateOnly = (value: Date) => value.toISOString().slice(0, 10);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const account = await resolveDashboardAccount(req, ["provider"], true);
  if (!account || "error" in account) return res.status(account && "error" in account ? account.status : 401).json({ error: account && "error" in account ? account.error : "Not authenticated" });
  const subscription = await prisma.provider_subscriptions.findFirst({ where: { provider_id: account.actingUserId, status: { in: [PartnerSubscriptionStatus.active, PartnerSubscriptionStatus.past_due] } }, orderBy: { created_at: "desc" } });
  if (!subscription) return res.status(404).json({ error: "No active provider subscription found" });
  if (subscription.billing_provider_subscription_id) await setSquareSubscriptionCanceledDate({ subscriptionId: subscription.billing_provider_subscription_id, canceledDate: dateOnly(subscription.current_period_end || new Date()), referenceId: `provider-cancel:${subscription.subscription_id}` });
  const updated = await prisma.provider_subscriptions.update({ where: { subscription_id: subscription.subscription_id }, data: { cancel_at_period_end: true } });
  return res.status(200).json({ cancelAtPeriodEnd: updated.cancel_at_period_end, currentPeriodEnd: updated.current_period_end });
}
