import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { getAppBaseUrl } from "../../../lib/app-url";
import { queueMemberInactiveEmail, type RecentMemberEvent } from "../../../lib/notification-templates";

type InactiveMemberCandidate = {
  member_id: string;
  email: string;
  first_name: string | null;
  recent_events: RecentMemberEvent[];
};

function isAuthorized(req: NextApiRequest) {
  const expected = String(process.env.EMAIL_SCHEDULER_SECRET || "").trim();
  if (!expected) return false;

  const authorization = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization;
  const provided = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : String(req.headers["x-email-scheduler-secret"] || "").trim();

  return provided === expected;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ queued: number; skipped: number } | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const candidates = await prisma.$queryRaw<InactiveMemberCandidate[]>`
      SELECT
        u.user_id AS member_id,
        u.email,
        u.first_name,
        recent.recent_events
      FROM users u
      JOIN member_profiles mp ON mp.user_id = u.user_id
      JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'eventName', recent_events.event_name,
            'partnerName', recent_events.partner_name
          ) ORDER BY recent_events.event_date DESC
        ) AS recent_events
        FROM (
          SELECT DISTINCT
            COALESCE(NULLIF(TRIM(e.title), ''), 'New event') AS event_name,
            COALESCE(NULLIF(TRIM(ppartner.org_name), ''), NULLIF(TRIM(partner.email), ''), 'Your partner') AS partner_name,
            e.start_date AS event_date
          FROM events e
          JOIN vouchers v ON v.event_id = e.event_id
          JOIN provider_profiles pp ON pp.user_id = v.provider_id
          JOIN users partner ON partner.user_id = e.partner_id
          LEFT JOIN partner_profiles ppartner ON ppartner.user_id = partner.user_id
          WHERE e.published = TRUE
            AND e.start_date >= (CURRENT_DATE - INTERVAL '30 days')::date
            AND (e.start_date IS NULL OR e.start_date >= CURRENT_DATE)
            AND LOWER(TRIM(COALESCE(v.status, ''))) = 'active'
            AND (v.expiration_date IS NULL OR v.expiration_date >= CURRENT_DATE)
            AND pp.network_code = mp.network_code
          ORDER BY e.start_date DESC
          LIMIT 3
        ) recent_events
      ) recent ON recent.recent_events IS NOT NULL
      WHERE u.user_type = 'member'
        AND mp.notification_enabled = TRUE
        AND NULLIF(TRIM(u.email), '') IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM member_vouchers mv
          WHERE mv.member_id = u.user_id
            AND mv.created_at >= NOW() - INTERVAL '30 days'
        )
        AND NOT EXISTS (
          SELECT 1
          FROM email_jobs ej
          WHERE ej.user_id = u.user_id
            AND ej.template_key = 'member.inactive_no_voucher_claims'
            AND ej.created_at >= NOW() - INTERVAL '30 days'
        )
      ORDER BY u.user_id;
    `;

    const reminderDate = new Date().toISOString().slice(0, 10);
    const browseLink = `${getAppBaseUrl(req)}/dashboard/deals`;
    const results = await Promise.allSettled(candidates.map((candidate) => queueMemberInactiveEmail({
      memberId: candidate.member_id,
      toEmail: candidate.email,
      firstName: candidate.first_name,
      recentEvents: candidate.recent_events,
      browseLink,
      reminderDate,
    })));

    const queued = results.filter((result) => result.status === "fulfilled" && result.value).length;
    const skipped = results.length - queued;
    if (skipped) {
      console.error(`Failed to queue ${skipped} inactive-member reminder(s)`);
    }

    return res.status(200).json({ queued, skipped });
  } catch (error) {
    console.error("schedule-member-inactive error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to schedule inactive-member reminders",
    });
  }
}
