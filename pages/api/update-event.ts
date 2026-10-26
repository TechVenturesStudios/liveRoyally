import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { resolveDashboardAccount } from "../../lib/dashboard-account";
import { getAppBaseUrl } from "../../lib/app-url";
import { queueEventChangedEmail } from "../../lib/notification-templates";
import { isDeadlinePassed } from "@/utils/inviteDeadline";

function parseDate(value: unknown) {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) throw new Error("Invalid date");
  return parsed;
}

function formatDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "TBD";
}

function changed(label: string, before: unknown, after: unknown) {
  const left = before instanceof Date ? formatDate(before) : String(before ?? "").trim();
  const right = after instanceof Date ? formatDate(after) : String(after ?? "").trim();
  return left === right ? null : `${label} changed from "${left || "blank"}" to "${right || "blank"}"`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") return res.status(405).json({ error: "Method not allowed" });
  const account = await resolveDashboardAccount(req, ["partner"]);
  if (!account || "error" in account) return res.status(account && "error" in account ? account.status : 401).json({ error: account && "error" in account ? account.error : "Not authenticated" });
  if (account.isRepresentative) return res.status(403).json({ error: "Authorized representatives cannot edit partner events" });

  try {
    const eventId = String(req.body?.eventId || "").trim();
    if (!eventId) return res.status(400).json({ error: "eventId is required" });
    const existing = await prisma.events.findFirst({ where: { event_id: eventId, partner_id: account.actingUserId } });
    if (!existing) return res.status(404).json({ error: "Event not found" });
    if (String(existing.status || "").toLowerCase() === "cancelled") return res.status(409).json({ error: "Cancelled events cannot be edited" });

    const requestedMemberPrice = req.body?.memberPrice === undefined
      ? existing.member_price
      : String(req.body.memberPrice).trim() === ""
        ? null
        : Number(req.body.memberPrice);
    if (requestedMemberPrice !== null && (!Number.isFinite(requestedMemberPrice) || requestedMemberPrice < 0)) {
      return res.status(400).json({ error: "memberPrice must be a valid non-negative number" });
    }
    const memberPriceChanged = requestedMemberPrice !== existing.member_price;
    if (memberPriceChanged) {
      const squareConnection = await prisma.partner_square_connections.findUnique({
        where: { user_id: account.actingUserId },
        select: { user_id: true },
      });
      if (!squareConnection) {
        return res.status(403).json({ error: "Connect your Square account on your profile before setting a member price for vouchers" });
      }
    }

    const next = {
      title: String(req.body?.title ?? existing.title ?? "").trim(),
      description: String(req.body?.description ?? existing.description ?? ""),
      location: String(req.body?.location ?? existing.location ?? "").trim(),
      event_time: String(req.body?.eventTime ?? existing.event_time ?? "").trim() || null,
      network_points: existing.network_points,
      member_price: requestedMemberPrice,
      total_vouchers_available: req.body?.totalVouchersAvailable === undefined ? existing.total_vouchers_available : Number(req.body.totalVouchersAvailable) || null,
      response_deadline: req.body?.responseDeadline === undefined ? existing.response_deadline : parseDate(req.body.responseDeadline),
      start_date: req.body?.startDate === undefined ? existing.start_date : parseDate(req.body.startDate),
      end_date: req.body?.endDate === undefined ? existing.end_date : parseDate(req.body.endDate),
    };
    if (!next.title || !next.location || !next.start_date) return res.status(400).json({ error: "Title, start date, and location are required" });

    const eventChangeSummary = [
      changed("Title", existing.title, next.title),
      changed("Start date", existing.start_date, next.start_date),
      changed("End date", existing.end_date, next.end_date),
      changed("Time", existing.event_time, next.event_time),
      changed("Location", existing.location, next.location),
    ].filter(Boolean).join("\n");
    const deadlineChangeSummary = changed("Provider response deadline", existing.response_deadline, next.response_deadline);
    const resendProviderIds: string[] = Array.isArray(req.body?.resendProviderIds)
      ? Array.from(new Set<string>(req.body.resendProviderIds.map((id: unknown) => String(id).trim()).filter(Boolean)))
      : [];

    if (!eventChangeSummary && !deadlineChangeSummary && !memberPriceChanged && existing.description === next.description && existing.total_vouchers_available === next.total_vouchers_available) {
      return res.status(200).json({ eventId, changed: false, notifications: { queued: 0, failed: 0 } });
    }
    const inviteIds = await prisma.event_provider_invites.findMany({
      where: { event_id: eventId },
      select: { provider_id: true },
    });
    const eventProviderIds = new Set(inviteIds.map((invite) => invite.provider_id));
    const invalidResendProviderId = resendProviderIds.find((providerId) => !eventProviderIds.has(providerId));
    if (invalidResendProviderId) return res.status(400).json({ error: "One or more selected providers were not invited to this event" });
    const deadlineChanged = deadlineChangeSummary !== null;
    const event = await prisma.events.update({ where: { event_id: eventId }, data: next, select: { event_id: true, title: true, start_date: true, location: true, partner_id: true } });
    if (deadlineChanged && !isDeadlinePassed(next.response_deadline)) {
      await prisma.event_provider_invites.updateMany({
        where: { event_id: eventId, provider_id: { in: resendProviderIds }, status: "expired", responded_at: null },
        data: { status: "pending" },
      });
    }
    const partner = await prisma.users.findUnique({
      where: { user_id: account.actingUserId },
      select: { email: true, partner_profiles: { select: { org_name: true, org_email: true, network_code: true } } },
    });
    const [members, providers] = await Promise.all([
      existing.published && eventChangeSummary && partner?.partner_profiles?.network_code
        ? prisma.$queryRaw<Array<{ user_id: string; email: string; first_name: string | null }>>`
            SELECT DISTINCT u.user_id, u.email, u.first_name
            FROM member_profiles mp
            JOIN users u ON u.user_id = mp.user_id
            WHERE mp.network_code = ${partner.partner_profiles.network_code}
              AND mp.notification_enabled = TRUE
              AND NULLIF(TRIM(u.email), '') IS NOT NULL
          `
        : Promise.resolve([]),
      eventChangeSummary
        ? prisma.$queryRaw<Array<{ user_id: string; email: string; first_name: string | null }>>`
        SELECT DISTINCT u.user_id, u.email, u.first_name FROM event_provider_invites i
        JOIN users u ON u.user_id = i.provider_id JOIN provider_profiles pp ON pp.user_id = u.user_id
        WHERE i.event_id = ${eventId} AND i.status = 'accepted' AND pp.notification_enabled = TRUE AND NULLIF(TRIM(u.email), '') IS NOT NULL
      `
        : Promise.resolve([]),
    ]);
    const shouldResendProviders = Boolean(eventChangeSummary) || Boolean(deadlineChangeSummary && !isDeadlinePassed(next.response_deadline));
    const resendProviders = resendProviderIds.length > 0 && shouldResendProviders
      ? await prisma.$queryRaw<Array<{ invite_id: string; user_id: string; email: string; first_name: string | null }>>`
          SELECT i.invite_id, u.user_id, u.email, u.first_name
          FROM event_provider_invites i
          JOIN users u ON u.user_id = i.provider_id
          JOIN provider_profiles pp ON pp.user_id = u.user_id
          WHERE i.event_id = ${eventId} AND i.provider_id IN (${Prisma.join(resendProviderIds)})
            AND pp.notification_enabled = TRUE AND NULLIF(TRIM(u.email), '') IS NOT NULL
        `
      : [];
    const baseUrl = getAppBaseUrl(req);
    const emailInputs = [
      ...members.map((member) => ({ recipientId: member.user_id, toEmail: member.email, firstName: member.first_name, changeSummary: eventChangeSummary })),
      ...providers.map((provider) => ({ recipientId: provider.user_id, toEmail: provider.email, firstName: provider.first_name, changeSummary: eventChangeSummary })),
      ...resendProviders.map((provider) => ({ recipientId: provider.user_id, toEmail: provider.email, firstName: provider.first_name, changeSummary: eventChangeSummary || deadlineChangeSummary || "Event details changed" })),
    ];
    const uniqueEmailInputs = [...new Map(emailInputs.map((recipient) => [recipient.recipientId, recipient])).values()];
    const results = await Promise.allSettled(uniqueEmailInputs.filter((recipient) => recipient.changeSummary).map((recipient) => queueEventChangedEmail({
      eventId,
      recipientId: recipient.recipientId,
      toEmail: recipient.toEmail,
      firstName: recipient.firstName,
      partnerName: partner?.partner_profiles?.org_name?.trim() || "Your partner",
      eventName: event.title || "Your event",
      changeSummary: recipient.changeSummary,
      eventDate: formatDate(event.start_date),
      eventLocation: event.location || "TBD",
      eventLink: `${baseUrl}/dashboard/deals?eventId=${encodeURIComponent(eventId)}`,
      partnerContactEmail: partner?.partner_profiles?.org_email || partner?.email,
    })));
    const allResults = results;
    return res.status(200).json({ eventId, changed: true, notifications: { queued: allResults.filter((result) => result.status === "fulfilled").length, failed: allResults.filter((result) => result.status === "rejected").length } });
  } catch (error) {
    console.error("update-event error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update event" });
  }
}
