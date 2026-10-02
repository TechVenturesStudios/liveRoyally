import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { getAppBaseUrl } from "../../../lib/app-url";
import { queueUpcomingEventReminderEmail } from "../../../lib/notification-templates";

type ReminderCandidate = {
  event_id: string;
  recipient_id: string;
  role: "member" | "provider" | "partner";
  email: string;
  first_name: string | null;
  event_name: string;
  event_date: Date;
  event_location: string;
  event_time: string | null;
  voucher_name: string | null;
  voucher_instructions: string | null;
  provider_instructions: string | null;
};

function isAuthorized(req: NextApiRequest) {
  const expected = String(process.env.EMAIL_SCHEDULER_SECRET || "").trim();
  if (!expected) return false;
  const authorization = Array.isArray(req.headers.authorization) ? req.headers.authorization[0] : req.headers.authorization;
  const provided = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : String(req.headers["x-email-scheduler-secret"] || "").trim();
  return provided === expected;
}

function formatDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "TBD";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!isAuthorized(req)) return res.status(401).json({ error: "Unauthorized" });

  try {
    const candidates = await prisma.$queryRaw<ReminderCandidate[]>`
      SELECT e.event_id, u.user_id AS recipient_id, 'member'::text AS role,
        u.email, u.first_name,
        COALESCE(NULLIF(TRIM(e.title), ''), 'your event') AS event_name,
        e.start_date AS event_date, COALESCE(e.location, '') AS event_location,
        e.event_time,
        COALESCE(NULLIF(TRIM(v.promo_item), ''), NULLIF(TRIM(e.title), ''), 'Local Metrics voucher') AS voucher_name,
        COALESCE(NULLIF(TRIM(v.promo_item), ''), 'Review your voucher details before attending.') AS voucher_instructions,
        NULL::text AS provider_instructions
      FROM events e
      JOIN vouchers v ON v.event_id = e.event_id
      JOIN member_vouchers mv ON mv.voucher_id = v.voucher_id
      JOIN users u ON u.user_id = mv.member_id
      JOIN member_profiles mp ON mp.user_id = u.user_id
      WHERE e.published = TRUE AND e.start_date = (CURRENT_DATE + INTERVAL '3 days')::date
        AND mp.notification_enabled = TRUE AND NULLIF(TRIM(u.email), '') IS NOT NULL
      UNION ALL
      SELECT e.event_id, u.user_id, 'provider'::text,
        u.email, u.first_name,
        COALESCE(NULLIF(TRIM(e.title), ''), 'your event'), e.start_date,
        COALESCE(e.location, ''), e.event_time, NULL, NULL,
        COALESCE(NULLIF(TRIM(i.invite_message), ''), 'Review your accepted event invitation.')
      FROM events e
      JOIN event_provider_invites i ON i.event_id = e.event_id AND i.status = 'accepted'
      JOIN users u ON u.user_id = i.provider_id
      JOIN provider_profiles pp ON pp.user_id = u.user_id
      WHERE e.published = TRUE AND e.start_date = (CURRENT_DATE + INTERVAL '3 days')::date
        AND pp.notification_enabled = TRUE AND NULLIF(TRIM(u.email), '') IS NOT NULL
      UNION ALL
      SELECT e.event_id, u.user_id, 'partner'::text,
        u.email, u.first_name,
        COALESCE(NULLIF(TRIM(e.title), ''), 'your event'), e.start_date,
        COALESCE(e.location, ''), e.event_time, NULL, NULL, NULL
      FROM events e
      JOIN users u ON u.user_id = e.partner_id
      JOIN partner_profiles pp ON pp.user_id = u.user_id
      WHERE e.published = TRUE AND e.start_date = (CURRENT_DATE + INTERVAL '3 days')::date
        AND pp.notification_enabled = TRUE AND NULLIF(TRIM(u.email), '') IS NOT NULL
      ORDER BY event_id, recipient_id;
    `;

    const baseUrl = getAppBaseUrl(req);
    const results = await Promise.allSettled(candidates.map((candidate) => queueUpcomingEventReminderEmail({
      eventId: candidate.event_id,
      recipientId: candidate.recipient_id,
      toEmail: candidate.email,
      firstName: candidate.first_name,
      eventName: candidate.event_name,
      eventDate: formatDate(candidate.event_date),
      eventLocation: candidate.event_location || "TBD",
      eventTime: candidate.event_time || "TBD",
      daysUntilEvent: 3,
      eventLink: `${baseUrl}/dashboard/deals?eventId=${encodeURIComponent(candidate.event_id)}`,
      eventManageLink: `${baseUrl}/dashboard/crm?eventId=${encodeURIComponent(candidate.event_id)}`,
      isMember: candidate.role === "member",
      isProvider: candidate.role === "provider",
      isPartner: candidate.role === "partner",
      voucherName: candidate.voucher_name,
      voucherInstructions: candidate.voucher_instructions,
      providerInstructions: candidate.provider_instructions,
    })));
    return res.status(200).json({ queued: results.filter((result) => result.status === "fulfilled").length, failed: results.filter((result) => result.status === "rejected").length });
  } catch (error) {
    console.error("schedule-upcoming-event-reminders error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to schedule event reminders" });
  }
}
