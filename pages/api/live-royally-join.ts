import type { NextApiRequest, NextApiResponse } from "next";
import { createHash } from "crypto";
import { PartnerSubscriptionStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { getCognitoIdFromRequest } from "../../lib/api-auth";
import { createSquareCard, createSquareCustomer, createSquareSubscription, getLiveRoyallyProviderPlanVariationId, squareIdempotencyKey } from "../../lib/square-partner-billing";
import { LIVE_ROYALLY_PROVIDER_SUBSCRIPTION_PRICE_CENTS } from "../../lib/live-royally";

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

async function findInvite(token: string) {
  return prisma.provider_join_tokens.findUnique({
    where: { token_hash: tokenHash(token) },
    select: {
      token_id: true, provider_id: true, partner_id: true, expires_at: true, used_at: true,
      provider: { select: { email: true, first_name: true, provider_profiles: { select: { business_name: true, business_email: true, business_phone: true, business_address: true, business_city: true, business_state: true, business_zip: true } } } },
    },
  });
}

function validInvite(invite: Awaited<ReturnType<typeof findInvite>>) {
  return Boolean(invite && !invite.used_at && invite.expires_at.getTime() > Date.now());
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const rawToken = String(req.method === "GET" ? req.query.token || "" : req.body?.token || "").trim();
  if (!rawToken) return res.status(400).json({ error: "A join token is required" });

  try {
    const invite = await findInvite(rawToken);
    if (!validInvite(invite)) return res.status(410).json({ error: "This invitation is invalid or has expired" });

    if (req.method === "GET") {
      return res.status(200).json({
        provider: { businessName: invite!.provider.provider_profiles?.business_name || "your business", email: invite!.provider.email },
        requiresSignIn: true,
        priceCents: LIVE_ROYALLY_PROVIDER_SUBSCRIPTION_PRICE_CENTS,
      });
    }

    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const cognitoId = getCognitoIdFromRequest(req);
    if (!cognitoId) return res.status(401).json({ error: "Please sign in to continue" });
    const user = await prisma.users.findUnique({ where: { cognito_id: cognitoId }, select: { user_id: true, user_type: true } });
    if (!user || user.user_type !== "provider" || user.user_id !== invite!.provider_id) return res.status(403).json({ error: "Please sign in to the provider account that received this invitation" });

    const existing = await prisma.provider_subscriptions.findFirst({ where: { provider_id: user.user_id, status: { in: [PartnerSubscriptionStatus.active, PartnerSubscriptionStatus.pending, PartnerSubscriptionStatus.past_due] } }, orderBy: { created_at: "desc" } });
    if (existing) return res.status(409).json({ error: "This provider already has a Live Royally subscription" });
    const planVariationId = getLiveRoyallyProviderPlanVariationId();
    if (!planVariationId) return res.status(503).json({ error: "Live Royally Square subscription plan is not configured" });
    const paymentToken = String(req.body?.paymentToken || "").trim();
    if (!paymentToken) return res.status(400).json({ error: "A valid card is required" });

    const profile = invite!.provider.provider_profiles;
    const referenceId = `live-royally-provider:${invite!.provider_id}:${invite!.token_id}`;
    const customerId = await createSquareCustomer({ email: invite!.provider.email, firstName: invite!.provider.first_name, organizationName: profile?.business_name, organizationPhone: profile?.business_phone, organizationAddress: profile?.business_address, organizationCity: profile?.business_city, organizationState: profile?.business_state, organizationZip: profile?.business_zip, referenceId });
    const cardId = await createSquareCard({ paymentToken, customerId, cardholderName: `${invite!.provider.first_name || ""}`.trim() || profile?.business_name || "Live Royally provider", referenceId });
    const squareSubscription = await createSquareSubscription({ customerId, cardId, planVariationId, priceOverrideCents: LIVE_ROYALLY_PROVIDER_SUBSCRIPTION_PRICE_CENTS, referenceId: `${referenceId}:subscription` });
    const start = squareSubscription.current_period_start ? new Date(squareSubscription.current_period_start) : new Date();
    const end = squareSubscription.current_period_end ? new Date(squareSubscription.current_period_end) : new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const claimed = await tx.provider_join_tokens.updateMany({ where: { token_id: invite!.token_id, used_at: null, expires_at: { gt: new Date() } }, data: { used_at: new Date() } });
      if (claimed.count !== 1) throw new Error("This invitation has already been used");
      const subscription = await tx.provider_subscriptions.create({ data: { provider_id: user.user_id, status: PartnerSubscriptionStatus.active, billing_provider_customer_id: customerId, billing_provider_card_id: cardId, billing_provider_subscription_id: squareSubscription.id, annual_price_cents: LIVE_ROYALLY_PROVIDER_SUBSCRIPTION_PRICE_CENTS, current_period_start: start, current_period_end: end } });
      await tx.provider_profiles.update({ where: { user_id: user.user_id }, data: { partner_id: invite!.partner_id } });
      return subscription;
    });
    return res.status(200).json({ joined: true, subscriptionId: result.subscription_id });
  } catch (error) {
    console.error("live royally join error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Unable to join the Live Royally Network" });
  }
}
