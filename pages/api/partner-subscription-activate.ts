import type { NextApiRequest, NextApiResponse } from "next";
import { PartnerSubscriptionStatus } from "@prisma/client";

import { resolveDashboardAccount } from "../../lib/dashboard-account";
import { prisma } from "../../lib/prisma";
import { expireEndedPartnerTrials } from "../../lib/promo-codes";
import {
  createSquareCard,
  createSquareCustomer,
  createSquareSubscription,
  disableSquareCard,
  getSquarePlanVariationId,
} from "../../lib/square-partner-billing";
import { PARTNER_SUBSCRIPTION_PLANS, type PartnerSubscriptionPlan } from "../../src/config/subscriptionPlans";

type ResponseBody =
  | { message: string; plan: PartnerSubscriptionPlan; currentPeriodEnd: string | null }
  | { error: string };

/**
 * Converts a free term (promo trial or one-year Starter plan, running or
 * expired) into a paid annual
 * Square subscription. Billing starts immediately; any remaining trial time is
 * forfeited because a future-dated Square subscription reports PENDING, which
 * the Square webhook would treat as a lapsed account.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseBody>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let createdCardId: string | null = null;

  try {
    // Expired-trial partners are locked out of everything else, so this
    // endpoint must accept inactive partner accounts.
    const account = await resolveDashboardAccount(req, ["partner"], false, true);
    if (!account) return res.status(500).json({ error: "Failed to resolve account" });
    if ("error" in account) return res.status(account.status).json({ error: account.error });
    if (account.isRepresentative) {
      return res.status(403).json({ error: "Only the partner account owner can purchase a subscription" });
    }

    const partnerId = account.actingUserId;
    const requestedPlan = String(req.body?.plan || "") as PartnerSubscriptionPlan;
    const planConfig = PARTNER_SUBSCRIPTION_PLANS[requestedPlan];
    const paymentToken = String(req.body?.paymentToken || "").trim();
    const checkoutKey = String(req.body?.checkoutKey || "").trim();

    if (!planConfig || planConfig.monthlyPriceCents === 0) {
      return res.status(400).json({ error: "Choose a paid membership plan" });
    }
    if (!paymentToken) return res.status(400).json({ error: "paymentToken is required" });
    if (!checkoutKey) return res.status(400).json({ error: "checkoutKey is required" });

    await expireEndedPartnerTrials(partnerId);

    const subscription = await prisma.partner_subscriptions.findFirst({
      where: { partner_id: partnerId },
      orderBy: { created_at: "desc" },
      select: {
        subscription_id: true,
        status: true,
        trial_ends_at: true,
        billing_provider_customer_id: true,
        billing_provider_subscription_id: true,
      },
    });

    const isTrial =
      Boolean(subscription?.trial_ends_at) &&
      !subscription?.billing_provider_subscription_id &&
      (subscription?.status === PartnerSubscriptionStatus.active ||
        subscription?.status === PartnerSubscriptionStatus.expired);

    if (!subscription || !isTrial) {
      return res.status(409).json({ error: "There is no free plan period on this account to convert" });
    }

    const providerCount = await prisma.provider_profiles.count({
      where: { partner_id: partnerId, application_status: "active", users: { user_type: "provider" } },
    });
    if (providerCount > planConfig.maxProviders) {
      return res.status(409).json({
        error: `You currently have ${providerCount} providers. The ${planConfig.label} plan allows up to ${planConfig.maxProviders}. Choose a larger plan.`,
      });
    }

    const planVariationId = getSquarePlanVariationId(requestedPlan);
    if (!planVariationId) {
      return res.status(503).json({ error: `Square is not configured for the ${planConfig.label} plan` });
    }

    const user = await prisma.users.findUnique({
      where: { user_id: partnerId },
      select: { email: true, first_name: true, last_name: true, partner_profiles: true },
    });
    if (!user) return res.status(404).json({ error: "Partner not found" });

    const profile = user.partner_profiles;
    const referenceId = `trial-conversion:${subscription.subscription_id}:${checkoutKey}`;

    const customerId =
      subscription.billing_provider_customer_id ??
      (await createSquareCustomer({
        email: user.email,
        firstName: profile?.agent_first_name ?? user.first_name,
        lastName: profile?.agent_last_name ?? user.last_name,
        organizationName: profile?.org_name,
        organizationPhone: profile?.org_phone,
        organizationAddress: profile?.org_address,
        organizationCity: profile?.org_city,
        organizationState: profile?.org_state,
        organizationZip: profile?.org_zip,
        referenceId,
      }));

    const cardholderName =
      `${profile?.agent_first_name ?? user.first_name ?? ""} ${profile?.agent_last_name ?? user.last_name ?? ""}`.trim() ||
      profile?.org_name ||
      "Partner";

    const cardId = await createSquareCard({ paymentToken, customerId, cardholderName, referenceId });
    createdCardId = cardId;

    const squareSubscription = await createSquareSubscription({
      customerId,
      cardId,
      planVariationId,
      referenceId,
    });
    // The card now backs a live Square subscription; never disable it below.
    createdCardId = null;

    const now = new Date();
    const updated = await prisma.partner_subscriptions.update({
      where: { subscription_id: subscription.subscription_id },
      data: {
        status: PartnerSubscriptionStatus.active,
        plan: requestedPlan,
        monthly_price_cents: planConfig.monthlyPriceCents,
        max_providers: planConfig.maxProviders,
        billing_provider_customer_id: customerId,
        billing_provider_card_id: cardId,
        billing_provider_subscription_id: squareSubscription.id,
        current_period_start: squareSubscription.current_period_start
          ? new Date(squareSubscription.current_period_start)
          : now,
        current_period_end: squareSubscription.current_period_end
          ? new Date(squareSubscription.current_period_end)
          : null,
        // Close out a trial that was still running so it reads as converted.
        trial_ends_at:
          subscription.trial_ends_at && subscription.trial_ends_at > now ? now : subscription.trial_ends_at,
        cancel_at_period_end: false,
        pending_plan: null,
        pending_change_effective_at: null,
        canceled_at: null,
        updated_at: now,
      },
      select: { current_period_end: true },
    });

    return res.status(200).json({
      message: `Your ${planConfig.label} subscription is active.`,
      plan: requestedPlan,
      currentPeriodEnd: updated.current_period_end?.toISOString() ?? null,
    });
  } catch (error) {
    if (createdCardId) {
      try {
        await disableSquareCard(createdCardId);
      } catch (cleanupError) {
        console.error("Failed to disable Square card after trial conversion error", cleanupError);
      }
    }

    console.error("partner-subscription-activate error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unable to start your subscription",
    });
  }
}
