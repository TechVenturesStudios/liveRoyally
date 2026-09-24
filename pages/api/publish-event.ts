import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { resolveDashboardAccount } from "../../lib/dashboard-account";
import { getAppBaseUrl } from "../../lib/app-url";
import { queuePublishedEventMemberEmail } from "../../lib/notification-templates";

type PublishEventResponse =
  | { event: { id: string; published: boolean; publishedAt: string } }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublishEventResponse>
) {
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const account = await resolveDashboardAccount(req, ["partner"]);
    if (!account) return res.status(500).json({ error: "Failed to resolve account" });
    if ("error" in account) return res.status(account.status).json({ error: account.error });

    const eventId = String(req.body?.eventId ?? "").trim();
    if (!eventId) return res.status(400).json({ error: "eventId is required" });

    const event = await prisma.events.updateMany({
      where: { event_id: eventId, partner_id: account.actingUserId, published: false },
      data: { published: true, published_at: new Date() },
    });

    if (event.count === 0) {
      const existing = await prisma.events.findFirst({
        where: { event_id: eventId, partner_id: account.actingUserId },
        select: { published: true },
      });
      if (!existing) return res.status(404).json({ error: "Event not found" });
      return res.status(200).json({
        event: { id: eventId, published: true, publishedAt: new Date().toISOString() },
      });
    }

    const [publishedEvent, partner] = await Promise.all([
      prisma.events.findUnique({
        where: { event_id: eventId },
        select: { event_id: true, title: true, description: true, location: true, start_date: true },
      }),
      prisma.users.findUnique({
        where: { user_id: account.actingUserId },
        select: {
          first_name: true,
          last_name: true,
          email: true,
          partner_profiles: { select: { org_name: true, network_code: true } },
        },
      }),
    ]);

    const networkCode = partner?.partner_profiles?.network_code?.trim();
    if (publishedEvent && networkCode) {
      const members = await prisma.users.findMany({
        where: {
          user_type: "member",
          email: { not: "" },
          member_profiles: {
            network_code: networkCode,
            OR: [{ notification_enabled: true }, { notification_enabled: null }],
          },
        },
        select: { user_id: true, email: true, first_name: true },
      });

      const partnerName = partner.partner_profiles?.org_name?.trim() ||
        [partner.first_name, partner.last_name].filter(Boolean).join(" ").trim() ||
        partner.email.trim() || "Your partner";
      const eventName = publishedEvent.title?.trim() || "New event";
      const eventDate = publishedEvent.start_date?.toISOString().slice(0, 10) || "Date to be announced";
      const eventLocation = publishedEvent.location?.trim() || "Location to be announced";
      const eventShortDescription = (publishedEvent.description?.trim() || "").replace(/\s+/g, " ").slice(0, 240);
      const eventLink = `${getAppBaseUrl(req)}/dashboard/deals?eventId=${encodeURIComponent(eventId)}`;

      await Promise.allSettled(members.map((member) => queuePublishedEventMemberEmail({
        eventId,
        memberId: member.user_id,
        toEmail: member.email,
        firstName: member.first_name,
        partnerName,
        eventName,
        eventDate,
        eventLocation,
        eventShortDescription,
        eventLink,
      })));
    }

    return res.status(200).json({
      event: { id: eventId, published: true, publishedAt: new Date().toISOString() },
    });
  } catch (error) {
    console.error("publish-event error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to publish event" });
  }
}
