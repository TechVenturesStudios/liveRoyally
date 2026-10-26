import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { resolveDashboardAccount } from "../../lib/dashboard-account";
import { queueEventCancellationEmail } from "../../lib/notification-templates";

function formatDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "TBD";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const account = await resolveDashboardAccount(req, ["partner"]);
  if (!account || "error" in account) return res.status(account && "error" in account ? account.status : 401).json({ error: account && "error" in account ? account.error : "Not authenticated" });
  if (account.isRepresentative) return res.status(403).json({ error: "Authorized representatives cannot cancel partner events" });

  try {
    const eventId = String(req.body?.eventId || "").trim();
    if (!eventId) return res.status(400).json({ error: "eventId is required" });

    const event = await prisma.events.findFirst({
      where: { event_id: eventId, partner_id: account.actingUserId },
      select: { event_id: true, title: true, location: true, start_date: true, published: true, status: true },
    });
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (String(event.status || "").toLowerCase() === "cancelled") return res.status(409).json({ error: "Event is already cancelled" });
    if (!event.start_date || event.start_date < new Date(new Date().toISOString().slice(0, 10))) {
      return res.status(400).json({ error: "Only future events can be cancelled" });
    }

    await prisma.events.update({ where: { event_id: eventId }, data: { status: "cancelled" } });
    const [partner, members, providers] = await Promise.all([
      prisma.users.findUnique({ where: { user_id: account.actingUserId }, select: { email: true, partner_profiles: { select: { org_name: true, org_email: true, network_code: true } } } }),
      event.published
        ? prisma.users.findMany({ where: { user_type: "member", email: { not: "" }, member_profiles: { network_code: { not: null }, notification_enabled: true } }, select: { user_id: true, email: true, first_name: true, member_profiles: { select: { network_code: true } } } }).then(async (rows) => {
            const code = (await prisma.partner_profiles.findUnique({ where: { user_id: account.actingUserId }, select: { network_code: true } }))?.network_code;
            return code ? rows.filter((row) => row.member_profiles?.network_code === code) : [];
          })
        : Promise.resolve([]),
      prisma.users.findMany({ where: { user_type: "provider", email: { not: "" }, provider_profiles: { partner_id: account.actingUserId, application_status: "active", notification_enabled: true } }, select: { user_id: true, email: true, first_name: true } }),
    ]);
    const partnerName = partner?.partner_profiles?.org_name?.trim() || "Your partner";
    const emailInputs = [
      ...members.map((member) => ({ ...member, recipientRole: "member" as const })),
      ...providers.map((provider) => ({ ...provider, recipientRole: "provider" as const })),
    ];
    const results = await Promise.allSettled(emailInputs.map((recipient) => queueEventCancellationEmail({
      eventId,
      recipientId: recipient.user_id,
      toEmail: recipient.email,
      firstName: recipient.first_name,
      recipientRole: recipient.recipientRole,
      partnerName,
      eventName: event.title?.trim() || "Your event",
      eventDate: formatDate(event.start_date),
      eventLocation: event.location?.trim() || "TBD",
      partnerContactEmail: partner?.partner_profiles?.org_email || partner?.email,
    })));
    return res.status(200).json({ eventId, cancelled: true, published: event.published, notifications: { queued: results.filter((result) => result.status === "fulfilled").length, failed: results.filter((result) => result.status === "rejected").length } });
  } catch (error) {
    console.error("cancel-event error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to cancel event" });
  }
}
