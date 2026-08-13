import type { NextApiRequest, NextApiResponse } from "next";
import { PartnerSubscriptionStatus } from "@prisma/client";

import { resolveDashboardAccount } from "../../../../lib/dashboard-account";
import { prisma } from "../../../../lib/prisma";
import {
  createSquareSubscription,
  disableSquareCard,
  getSquarePlanVariationId,
} from "../../../../lib/square-partner-billing";

type PendingPartnerActionResponse =
  | {
      subscriptionId: string;
      status: PartnerSubscriptionStatus;
      approvedAt: string | null;
      canceledAt: string | null;
      squareSubscriptionId: string | null;
      alreadyHandled?: boolean;
    }
  | {
      error: string;
    };

function getSubscriptionId(req: NextApiRequest) {
  return String(req.query.subscriptionId || "").trim();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PendingPartnerActionResponse>
) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const account = await resolveDashboardAccount(req, ["admin"]);

    if (!account) {
      return res.status(500).json({ error: "Unable to resolve admin account" });
    }

    if ("error" in account) {
      return res.status(account.status).json({ error: account.error });
    }

    const subscriptionId = getSubscriptionId(req);
    const action = String(req.body?.action || "").trim().toLowerCase();

    if (!subscriptionId) {
      return res.status(400).json({ error: "subscriptionId is required" });
    }

    if (action !== "approve" && action !== "decline") {
      return res.status(400).json({ error: "action must be approve or decline" });
    }

    const subscription = await prisma.partner_subscriptions.findUnique({
      where: { subscription_id: subscriptionId },
      select: {
        subscription_id: true,
        status: true,
        plan: true,
        billing_provider_customer_id: true,
        billing_provider_card_id: true,
        billing_provider_subscription_id: true,
        monthly_price_cents: true,
        users: {
          select: {
            user_id: true,
            email: true,
            partner_profiles: {
              select: {
                org_name: true,
              },
            },
          },
        },
      },
    });

    if (!subscription) {
      return res.status(404).json({ error: "Pending partner application not found" });
    }

    if (action === "approve") {
      if (subscription.status !== PartnerSubscriptionStatus.pending) {
        return res.status(200).json({
          subscriptionId: subscription.subscription_id,
          status: subscription.status,
          approvedAt: null,
          canceledAt: null,
          squareSubscriptionId: subscription.billing_provider_subscription_id ?? null,
          alreadyHandled: true,
        });
      }

      if (!subscription.billing_provider_customer_id) {
        return res.status(400).json({ error: "Missing Square customer ID for this partner" });
      }

      if (!subscription.billing_provider_card_id) {
        return res.status(400).json({ error: "Missing Square card ID for this partner" });
      }

      const planVariationId = getSquarePlanVariationId(subscription.plan);
      if (!planVariationId) {
        return res.status(500).json({
          error: `Missing Square plan variation ID for membership plan ${subscription.plan}`,
        });
      }

      const approvedAt = new Date();
      const squareSubscription = await createSquareSubscription({
        customerId: subscription.billing_provider_customer_id,
        cardId: subscription.billing_provider_card_id,
        planVariationId,
        referenceId: `partner-approval:${subscription.subscription_id}`,
      });

      const updated = await prisma.partner_subscriptions.update({
        where: { subscription_id: subscription.subscription_id },
        data: {
          status: PartnerSubscriptionStatus.active,
          billing_provider_subscription_id: squareSubscription.id,
          current_period_start: squareSubscription.current_period_start
            ? new Date(squareSubscription.current_period_start)
            : approvedAt,
          current_period_end: squareSubscription.current_period_end
            ? new Date(squareSubscription.current_period_end)
            : null,
          approved_at: approvedAt,
          canceled_at: null,
          updated_at: approvedAt,
        },
        select: {
          subscription_id: true,
          status: true,
          approved_at: true,
          canceled_at: true,
          billing_provider_subscription_id: true,
        },
      });

      return res.status(200).json({
        subscriptionId: updated.subscription_id,
        status: updated.status,
        approvedAt: updated.approved_at?.toISOString() ?? null,
        canceledAt: updated.canceled_at?.toISOString() ?? null,
        squareSubscriptionId: updated.billing_provider_subscription_id ?? null,
      });
    }

    if (subscription.status !== PartnerSubscriptionStatus.pending) {
      return res.status(200).json({
        subscriptionId: subscription.subscription_id,
        status: subscription.status,
        approvedAt: null,
        canceledAt: null,
        squareSubscriptionId: subscription.billing_provider_subscription_id ?? null,
        alreadyHandled: true,
      });
    }

    if (subscription.billing_provider_card_id) {
      await disableSquareCard(subscription.billing_provider_card_id);
    }

    const declinedAt = new Date();
    const updated = await prisma.partner_subscriptions.update({
      where: { subscription_id: subscription.subscription_id },
      data: {
        status: PartnerSubscriptionStatus.declined,
        approved_at: null,
        canceled_at: null,
        updated_at: declinedAt,
      },
      select: {
        subscription_id: true,
        status: true,
        approved_at: true,
        canceled_at: true,
        billing_provider_subscription_id: true,
      },
    });

    return res.status(200).json({
      subscriptionId: updated.subscription_id,
      status: updated.status,
      approvedAt: updated.approved_at?.toISOString() ?? null,
      canceledAt: updated.canceled_at?.toISOString() ?? null,
      squareSubscriptionId: updated.billing_provider_subscription_id ?? null,
    });
  } catch (error) {
    console.error("admin pending-partners action error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update partner approval",
    });
  }
}
