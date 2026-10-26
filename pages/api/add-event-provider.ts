import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { resolveDashboardAccount } from "../../lib/dashboard-account";
import { getAppBaseUrl } from "../../lib/app-url";
import { queueProviderInvitationEmail } from "../../lib/notification-templates";
import { isDeadlinePassed } from "../../src/utils/inviteDeadline";

function dateKey(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const account = await resolveDashboardAccount(req, ["partner"]);
  if (!account || "error" in account) return res.status(account && "error" in account ? account.status : 401).json({ error: account && "error" in account ? account.error : "Not authenticated" });
  if (account.isRepresentative) return res.status(403).json({ error: "Authorized representatives cannot add event providers" });

  try {
    const eventId = String(req.body?.eventId || "").trim();
    const providerId = String(req.body?.providerId || "").trim();
    if (!eventId || !providerId) return res.status(400).json({ error: "eventId and providerId are required" });

    const event = await prisma.events.findFirst({
      where: { event_id: eventId, partner_id: account.actingUserId },
      select: { event_id: true, title: true, location: true, event_time: true, start_date: true, end_date: true, response_deadline: true, status: true },
    });
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (String(event.status || "").toLowerCase() === "cancelled") return res.status(409).json({ error: "Cancelled events cannot receive new providers" });
    if (!event.start_date || (event.end_date ?? event.start_date) < new Date(new Date().toISOString().slice(0, 10))) return res.status(400).json({ error: "Providers cannot be added after the event has happened" });
    if (isDeadlinePassed(event.response_deadline)) return res.status(400).json({ error: "The provider response deadline has passed" });

    const [provider, existingInvite, partner] = await Promise.all([
      prisma.users.findFirst({
        where: { user_id: providerId, user_type: "provider", provider_profiles: { partner_id: account.actingUserId, application_status: "active" } },
        select: { user_id: true, email: true, first_name: true, provider_profiles: { select: { business_email: true } } },
      }),
      prisma.event_provider_invites.findUnique({ where: { event_id_provider_id: { event_id: eventId, provider_id: providerId } }, select: { invite_id: true } }),
      prisma.users.findUnique({ where: { user_id: account.actingUserId }, select: { email: true, first_name: true, last_name: true, partner_profiles: { select: { org_name: true } } } }),
    ]);
    if (!provider) return res.status(400).json({ error: "Provider is not an active provider in this partner's network" });
    if (existingInvite) return res.status(409).json({ error: "This provider has already been invited to the event" });

    const invite = await prisma.event_provider_invites.create({
      data: { event_id: eventId, provider_id: providerId, partner_id: account.actingUserId, status: "pending" },
      select: { invite_id: true },
    });
    const partnerName = partner?.partner_profiles?.org_name?.trim() || [partner?.first_name, partner?.last_name].filter(Boolean).join(" ").trim() || partner?.email || "Your partner";
    const emailResult = await queueProviderInvitationEmail({
      inviteId: invite.invite_id,
      providerId: provider.user_id,
      toEmail: provider.provider_profiles?.business_email?.trim() || provider.email,
      firstName: provider.first_name,
      partnerName,
      eventName: event.title,
      eventDate: dateKey(event.start_date) || "TBD",
      eventTime: event.event_time || "TBD",
      eventLocation: event.location || "TBD",
      acceptInviteLink: `${getAppBaseUrl(req)}/dashboard/provider-pending-events`,
      inviteExpirationDate: dateKey(event.response_deadline),
    });
    return res.status(200).json({ inviteId: invite.invite_id, providerId, notificationQueued: Boolean(emailResult) });
  } catch (error) {
    console.error("add-event-provider error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to add provider to event" });
  }
}
