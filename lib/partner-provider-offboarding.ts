import { createHash, randomBytes } from "crypto";

import { LIVE_ROYALLY_PARTNER_EMAIL } from "./live-royally";
import { queueProviderRemovedEmail } from "./notification-templates";
import { prisma } from "./prisma";

const JOIN_TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;

export async function offboardPartnerProviders(input: {
  partnerId: string;
  providerIds?: string[];
  baseUrl?: string;
}) {
  const providers = await prisma.provider_profiles.findMany({
    where: {
      partner_id: input.partnerId,
      ...(input.providerIds?.length ? { user_id: { in: input.providerIds } } : {}),
    },
    select: {
      user_id: true,
      business_email: true,
      users: { select: { email: true, first_name: true } },
    },
  });

  if (!providers.length) return { providerCount: 0, emailsQueued: 0 };

  const [partner, liveRoyally] = await Promise.all([
    prisma.users.findUnique({
      where: { user_id: input.partnerId },
      select: { partner_profiles: { select: { org_name: true } } },
    }),
    prisma.users.findUnique({
      where: { email: LIVE_ROYALLY_PARTNER_EMAIL },
      select: { user_id: true, partner_profiles: { select: { org_name: true } } },
    }),
  ]);

  if (!liveRoyally?.partner_profiles) {
    throw new Error("Live Royally fallback partner is not configured");
  }

  await prisma.provider_profiles.updateMany({
    where: { user_id: { in: providers.map((provider) => provider.user_id) }, partner_id: input.partnerId },
    data: { partner_id: null },
  });

  const baseUrl = (input.baseUrl || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const partnerName = partner?.partner_profiles?.org_name?.trim() || "Your partner";
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.SES_FROM_EMAIL || "support@localmetrics.com";
  let emailsQueued = 0;

  for (const provider of providers) {
    const recipientEmail = provider.users.email?.trim() || provider.business_email?.trim();
    if (!recipientEmail) continue;

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    await prisma.provider_join_tokens.create({
      data: {
        token_hash: tokenHash,
        provider_id: provider.user_id,
        partner_id: liveRoyally.user_id,
        expires_at: new Date(Date.now() + JOIN_TOKEN_LIFETIME_MS),
      },
    });

    await queueProviderRemovedEmail({
      providerId: provider.user_id,
      toEmail: recipientEmail,
      firstName: provider.users.first_name,
      partnerName,
      lrnJoinLink: `${baseUrl}/join-network?token=${encodeURIComponent(rawToken)}`,
      supportEmail,
      idempotencyKey: `provider-offboarding:${input.partnerId}:${provider.user_id}`,
    });
    emailsQueued += 1;
  }

  return { providerCount: providers.length, emailsQueued };
}

