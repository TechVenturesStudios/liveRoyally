import type { NextApiRequest, NextApiResponse } from "next";
import { PartnerSubscriptionStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { resolveDashboardAccount } from "../../lib/dashboard-account";
import {
  cancelSquareSubscription,
  createSquareSubscription,
  getSquarePlanVariationId,
  setSquareSubscriptionCanceledDate,
  swapSquareSubscriptionPlan,
} from "../../lib/square-partner-billing";
import {
  PARTNER_SUBSCRIPTION_PLANS,
  type PartnerSubscriptionPlan,
} from "../../src/config/subscriptionPlans";

type ResponseBody = {
  error?: string;
  message?: string;
  effectiveAt?: string | null;
  plan?: PartnerSubscriptionPlan | null;
  canceled?: boolean;
};

const planKeys = Object.keys(PARTNER_SUBSCRIPTION_PLANS) as PartnerSubscriptionPlan[];

function isPlan(value: unknown): value is PartnerSubscriptionPlan {
  return typeof value === "string" && planKeys.includes(value as PartnerSubscriptionPlan);
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function effectiveDate(subscription: { current_period_end: Date | null }) {
  return subscription.current_period_end ?? new Date();
}

function proratedUpgradePriceCents(
  subscription: { monthly_price_cents: number; current_period_start: Date | null; current_period_end: Date | null },
  targetPriceCents: number
) {
  if (!subscription.current_period_start || !subscription.current_period_end) return targetPriceCents;

  const totalDays = Math.max(
    1,
    subscription.current_period_end.getTime() - subscription.current_period_start.getTime()
  );
  const remainingDays = Math.max(
    0,
    subscription.current_period_end.getTime() - Date.now()
  );
  const unusedCredit = Math.round(subscription.monthly_price_cents * (remainingDays / totalDays));
  return Math.max(0, targetPriceCents - unusedCredit);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const account = await resolveDashboardAccount(req, ["partner"]);
    if (!account) return res.status(500).json({ error: "Failed to resolve account" });
    if ("error" in account) return res.status(account.status).json({ error: account.error });

    const requestedPlan = req.body?.plan;
    const isCancellation = requestedPlan === null || requestedPlan === "cancel";
    if (!isCancellation && !isPlan(requestedPlan)) {
      return res.status(400).json({ error: "A valid target plan is required" });
    }

    const subscription = await prisma.partner_subscriptions.findFirst({
      where: { partner_id: account.actingUserId, status: PartnerSubscriptionStatus.active },
      orderBy: { created_at: "desc" },
    });
    if (!subscription) return res.status(404).json({ error: "No active subscription found" });

    const providerCount = await prisma.provider_profiles.count({
      where: { partner_id: account.actingUserId, users: { user_type: "provider" } },
    });

    if (isCancellation) {
      const end = effectiveDate(subscription);
      const hasRenewal = Boolean(subscription.current_period_end || subscription.billing_provider_subscription_id);
      if (subscription.billing_provider_subscription_id) {
        await cancelSquareSubscription(subscription.billing_provider_subscription_id);
      }

      await prisma.partner_subscriptions.update({
        where: { subscription_id: subscription.subscription_id },
        data: {
          ...(hasRenewal ? {} : {
            status: PartnerSubscriptionStatus.canceled,
            canceled_at: new Date(),
          }),
          cancel_at_period_end: true,
          pending_plan: null,
          pending_change_effective_at: end,
        },
      });

      return res.status(200).json({
        canceled: true,
        message: "Your subscription will remain active through the current billing period and will not renew.",
        effectiveAt: end.toISOString(),
      });
    }

    const targetPlan = requestedPlan as PartnerSubscriptionPlan;
    const currentPlan = subscription.plan as PartnerSubscriptionPlan;
    if (targetPlan === currentPlan && !subscription.pending_plan) {
      return res.status(400).json({ error: "You are already on this plan" });
    }

    const currentPlanConfig = PARTNER_SUBSCRIPTION_PLANS[currentPlan];
    const targetPlanConfig = PARTNER_SUBSCRIPTION_PLANS[targetPlan];
    const isUpgrade = targetPlanConfig.monthlyPriceCents > currentPlanConfig.monthlyPriceCents;

    if (!isUpgrade && targetPlanConfig.maxProviders < providerCount) {
      return res.status(409).json({
        error: `You currently have ${providerCount} providers. The ${targetPlanConfig.label} plan allows up to ${targetPlanConfig.maxProviders}. Remove ${providerCount - targetPlanConfig.maxProviders} provider(s) before downgrading.`,
      });
    }

    const targetVariationId = getSquarePlanVariationId(targetPlan);
    if (!targetVariationId && targetPlan !== "starter") {
      return res.status(503).json({ error: `Square is not configured for the ${targetPlanConfig.label} plan` });
    }

    const end = effectiveDate(subscription);
    if (isUpgrade) {
      if (subscription.billing_provider_subscription_id) {
        await setSquareSubscriptionCanceledDate({
          subscriptionId: subscription.billing_provider_subscription_id,
          canceledDate: dateOnly(new Date()),
          referenceId: `${subscription.subscription_id}:${targetPlan}`,
        });
      }

      let newSquareSubscriptionId = subscription.billing_provider_subscription_id;
      if (targetVariationId) {
        if (!subscription.billing_provider_customer_id || !subscription.billing_provider_card_id) {
          return res.status(400).json({ error: "A saved Square payment method is required to upgrade." });
        }

        const created = await createSquareSubscription({
          customerId: subscription.billing_provider_customer_id,
          cardId: subscription.billing_provider_card_id,
          planVariationId: targetVariationId,
          referenceId: `${subscription.subscription_id}:${targetPlan}:${Date.now()}`,
          priceOverrideCents: proratedUpgradePriceCents(subscription, targetPlanConfig.monthlyPriceCents),
        });
        newSquareSubscriptionId = created.id ?? null;
      }

      await prisma.partner_subscriptions.update({
        where: { subscription_id: subscription.subscription_id },
        data: {
          plan: targetPlan,
          monthly_price_cents: targetPlanConfig.monthlyPriceCents,
          max_providers: targetPlanConfig.maxProviders,
          billing_provider_subscription_id: newSquareSubscriptionId,
          pending_plan: null,
          pending_change_effective_at: null,
          cancel_at_period_end: false,
          current_period_start: new Date(),
          current_period_end: null,
        },
      });

      return res.status(200).json({
        plan: targetPlan,
        message: `Your plan was upgraded to ${targetPlanConfig.label} immediately. Your next charge reflects the prorated difference.`,
        effectiveAt: new Date().toISOString(),
      });
    }

    if (subscription.billing_provider_subscription_id && targetPlan !== "starter") {
      await swapSquareSubscriptionPlan({
        subscriptionId: subscription.billing_provider_subscription_id,
        planVariationId: targetVariationId!,
        referenceId: `${subscription.subscription_id}:${targetPlan}`,
      });
    } else if (subscription.billing_provider_subscription_id) {
      await cancelSquareSubscription(subscription.billing_provider_subscription_id);
    }

    await prisma.partner_subscriptions.update({
      where: { subscription_id: subscription.subscription_id },
      data: {
        pending_plan: targetPlan,
        pending_change_effective_at: end,
        cancel_at_period_end: targetPlan === "starter",
      },
    });

    return res.status(200).json({
      plan: targetPlan,
      message: `Your downgrade to ${targetPlanConfig.label} is scheduled for renewal. You can keep your current plan until then.`,
      effectiveAt: end.toISOString(),
    });
  } catch (error) {
    console.error("partner subscription update error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unable to update subscription",
    });
  }
}
