import { createHmac, timingSafeEqual } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { PartnerSubscriptionStatus } from "@prisma/client";

import { prisma } from "../../../lib/prisma";
import { normalizeSquareStatus } from "../../../lib/square-partner-billing";
import { PARTNER_SUBSCRIPTION_PLANS } from "../../../src/config/subscriptionPlans";

export const config = {
  api: {
    bodyParser: false,
  },
};

type SquareWebhookEvent = {
  type?: string;
  data?: {
    object?: {
      subscription?: SquareSubscription;
      invoice?: SquareInvoice;
    };
  };
};

type SquareSubscription = {
  id?: string;
  status?: string;
  current_period_start_date?: string;
  current_period_end_date?: string;
  start_date?: string;
  canceled_date?: string;
};

type SquareInvoice = {
  subscription_id?: string;
  status?: string;
  payment_requests?: Array<{
    computed_amount_money?: { amount?: number };
    due_date?: string;
  }>;
};

function getHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function readRawBody(req: NextApiRequest) {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

function getNotificationUrl(req: NextApiRequest) {
  const configuredUrl = String(process.env.SQUARE_WEBHOOK_URL || "").trim();
  if (configuredUrl) return configuredUrl;

  const protocol = getHeaderValue(req.headers["x-forwarded-proto"]) || "https";
  const host = getHeaderValue(req.headers.host);
  if (!host || !req.url) {
    throw new Error("Missing SQUARE_WEBHOOK_URL and request URL headers");
  }

  return `${protocol}://${host}${req.url}`;
}

function isValidSquareSignature(req: NextApiRequest, rawBody: Buffer) {
  const signatureKey = String(process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || "").trim();
  const receivedSignature = getHeaderValue(req.headers["x-square-hmacsha256-signature"]);

  if (!signatureKey || !receivedSignature) return false;

  const expectedSignature = createHmac("sha256", signatureKey)
    .update(getNotificationUrl(req) + rawBody.toString("utf8"))
    .digest("base64");
  const expected = Buffer.from(expectedSignature, "utf8");
  const received = Buffer.from(receivedSignature, "utf8");

  return expected.length === received.length && timingSafeEqual(expected, received);
}

function toDate(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function isPaymentMadeEvent(eventType: string) {
  return eventType === "invoice.payment_made";
}

function isPaymentFailedEvent(eventType: string) {
  return (
    eventType === "invoice.payment_failed" ||
    eventType === "invoice.scheduled_charge_failed" ||
    eventType === "subscription.payment_failed"
  );
}

function isSubscriptionEvent(eventType: string) {
  return ["subscription.created", "subscription.updated", "subscription.deleted"].includes(eventType);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let rawBody: Buffer;
  try {
    rawBody = await readRawBody(req);
  } catch (error) {
    console.error("Failed to read Square webhook body", error);
    return res.status(400).json({ error: "Invalid webhook body" });
  }

  try {
    if (!isValidSquareSignature(req, rawBody)) {
      return res.status(403).json({ error: "Invalid Square webhook signature" });
    }
  } catch (error) {
    console.error("Failed to validate Square webhook signature", error);
    return res.status(500).json({ error: "Webhook signature configuration error" });
  }

  let event: SquareWebhookEvent;
  try {
    event = JSON.parse(rawBody.toString("utf8")) as SquareWebhookEvent;
  } catch {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  const eventType = String(event.type || "");
  const subscription = event.data?.object?.subscription;
  const invoice = event.data?.object?.invoice;
  const squareSubscriptionId = subscription?.id || invoice?.subscription_id;

  if (!squareSubscriptionId || (!isSubscriptionEvent(eventType) && !isPaymentMadeEvent(eventType) && !isPaymentFailedEvent(eventType))) {
    return res.status(200).json({ received: true, handled: false });
  }

  const existing = await prisma.partner_subscriptions.findUnique({
    where: { billing_provider_subscription_id: squareSubscriptionId },
    select: {
      subscription_id: true,
      pending_plan: true,
      pending_change_effective_at: true,
    },
  });

  if (!existing) {
    console.warn("Square webhook subscription was not found", { eventType, squareSubscriptionId });
    return res.status(200).json({ received: true, handled: false });
  }

  let status: PartnerSubscriptionStatus;
  if (isPaymentMadeEvent(eventType)) {
    status = PartnerSubscriptionStatus.active;
  } else if (isPaymentFailedEvent(eventType)) {
    status = PartnerSubscriptionStatus.past_due;
  } else if (eventType === "subscription.deleted") {
    status = PartnerSubscriptionStatus.canceled;
  } else {
    status = normalizeSquareStatus(subscription?.status);
  }

  const scheduledPlan = existing.pending_plan;
  const scheduledPlanIsDue = Boolean(
    scheduledPlan &&
      existing.pending_change_effective_at &&
      existing.pending_change_effective_at.getTime() <= Date.now()
  );
  const cancellationToStarter = eventType === "subscription.deleted" && scheduledPlan === "starter";
  const appliedPlan = scheduledPlanIsDue || cancellationToStarter ? scheduledPlan : null;
  const appliedPlanConfig = appliedPlan ? PARTNER_SUBSCRIPTION_PLANS[appliedPlan] : null;
  const isCompleteCancellation = eventType === "subscription.deleted" && !cancellationToStarter;
  if (cancellationToStarter) status = PartnerSubscriptionStatus.active;

  const updated = await prisma.partner_subscriptions.update({
    where: { subscription_id: existing.subscription_id },
    data: {
      status,
      updated_at: new Date(),
      ...(appliedPlanConfig
        ? {
            plan: appliedPlan,
            monthly_price_cents: appliedPlanConfig.monthlyPriceCents,
            max_providers: appliedPlanConfig.maxProviders,
            pending_plan: null,
            pending_change_effective_at: null,
            cancel_at_period_end: false,
          }
        : {}),
      ...(isCompleteCancellation ? { cancel_at_period_end: false } : {}),
      ...(status === PartnerSubscriptionStatus.active ? { canceled_at: null } : {}),
      ...(status === PartnerSubscriptionStatus.canceled
        ? { canceled_at: toDate(subscription?.canceled_date) || new Date() }
        : {}),
      ...(subscription?.current_period_start_date
        ? { current_period_start: toDate(subscription.current_period_start_date) }
        : {}),
      ...(subscription?.current_period_end_date
        ? { current_period_end: toDate(subscription.current_period_end_date) }
        : {}),
    },
    select: {
      subscription_id: true,
      partner_id: true,
      status: true,
      billing_provider_subscription_id: true,
    },
  });

  return res.status(200).json({ received: true, handled: true, subscription: updated });
}
