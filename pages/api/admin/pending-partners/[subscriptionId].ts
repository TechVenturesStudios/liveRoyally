import type { NextApiRequest, NextApiResponse } from "next";
import { PartnerSubscriptionStatus } from "@prisma/client";

import { resolveDashboardAccount } from "../../../../lib/dashboard-account";
import { prisma } from "../../../../lib/prisma";
import {
  createSquareSubscription,
  disableSquareCard,
  getSquarePlanVariationId,
} from "../../../../lib/square-partner-billing";
import { setCognitoTemporaryPassword } from "../../../../lib/cognito-admin";
import { sendSesSimpleEmail } from "../../../../lib/ses-email";

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

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

async function sendPartnerApprovalEmail(email: string, organizationName: string) {
  const temporaryPassword = await setCognitoTemporaryPassword(email);
  const safeOrganizationName = escapeHtml(organizationName || "Live Royally partner");
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://liveroyally.com"}/login`;

  await sendSesSimpleEmail({
    toEmail: email,
    subject: "Your Live Royally partner account is approved",
    textBody: [
      `Your Live Royally partner account for ${organizationName || "your organization"} has been approved.`,
      "",
      "Sign in with:",
      `Email: ${email}`,
      `Temporary password: ${temporaryPassword}`,
      `Login: ${loginUrl}`,
      "",
      "You will be prompted to create a new password when you sign in.",
    ].join("\n"),
    htmlBody: `<p>Your Live Royally partner account for <strong>${safeOrganizationName}</strong> has been approved.</p><p><strong>Email:</strong> ${escapeHtml(email)}<br /><strong>Temporary password:</strong> ${escapeHtml(temporaryPassword)}</p><p><a href="${escapeHtml(loginUrl)}">Sign in to Live Royally</a></p><p>You will be prompted to create a new password when you sign in.</p>`,
  });
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
        approval_email_sent_at: true,
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
      if (
        subscription.status !== PartnerSubscriptionStatus.pending ||
        subscription.billing_provider_subscription_id
      ) {
        if (
          subscription.status === PartnerSubscriptionStatus.active &&
          !subscription.approval_email_sent_at
        ) {
          await sendPartnerApprovalEmail(
            subscription.users.email,
            subscription.users.partner_profiles?.org_name ?? ""
          );
          const emailSentAt = new Date();
          await prisma.partner_subscriptions.update({
            where: { subscription_id: subscription.subscription_id },
            data: { approval_email_sent_at: emailSentAt, updated_at: emailSentAt },
          });
        }

        return res.status(200).json({
          subscriptionId: subscription.subscription_id,
          status: subscription.status,
          approvedAt: null,
          canceledAt: null,
          squareSubscriptionId: subscription.billing_provider_subscription_id ?? null,
          alreadyHandled: true,
        });
      }

      const approvedAt = new Date();
      const isFreePlan = subscription.monthly_price_cents === 0;

      if (isFreePlan) {
        const updated = await prisma.partner_subscriptions.update({
          where: { subscription_id: subscription.subscription_id },
          data: {
            status: PartnerSubscriptionStatus.active,
            billing_provider_subscription_id: null,
            current_period_start: approvedAt,
            current_period_end: null,
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

        await sendPartnerApprovalEmail(
          subscription.users.email,
          subscription.users.partner_profiles?.org_name ?? ""
        );
        const emailSentAt = new Date();
        await prisma.partner_subscriptions.update({
          where: { subscription_id: subscription.subscription_id },
          data: { approval_email_sent_at: emailSentAt, updated_at: emailSentAt },
        });

        return res.status(200).json({
          subscriptionId: updated.subscription_id,
          status: updated.status,
          approvedAt: updated.approved_at?.toISOString() ?? null,
          canceledAt: updated.canceled_at?.toISOString() ?? null,
          squareSubscriptionId: updated.billing_provider_subscription_id ?? null,
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

      await sendPartnerApprovalEmail(
        subscription.users.email,
        subscription.users.partner_profiles?.org_name ?? ""
      );
      const emailSentAt = new Date();
      await prisma.partner_subscriptions.update({
        where: { subscription_id: subscription.subscription_id },
        data: { approval_email_sent_at: emailSentAt, updated_at: emailSentAt },
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
