import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { getAppBaseUrl } from "../../../lib/app-url";
import { queuePartnerInactiveEmail } from "../../../lib/notification-templates";

type InactivePartnerCandidate = {
  partner_id: string;
  email: string;
  first_name: string | null;
  partner_name: string;
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
    const candidates = await prisma.$queryRaw<InactivePartnerCandidate[]>`
      SELECT
        u.user_id AS partner_id,
        u.email,
        u.first_name,
        COALESCE(NULLIF(TRIM(pp.org_name), ''), NULLIF(TRIM(u.email), ''), 'Your organization') AS partner_name
      FROM users u
      JOIN partner_profiles pp ON pp.user_id = u.user_id
      WHERE u.user_type = 'partner'
        AND u.created_at <= NOW() - INTERVAL '30 days'
        AND pp.notification_enabled = TRUE
        AND NULLIF(TRIM(u.email), '') IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM events e
          WHERE e.partner_id = u.user_id
            AND e.created_at >= NOW() - INTERVAL '30 days'
        )
        AND NOT EXISTS (
          SELECT 1
          FROM email_jobs ej
          WHERE ej.user_id = u.user_id
            AND ej.template_key = 'partner.inactive_no_event'
            AND ej.created_at >= NOW() - INTERVAL '30 days'
        )
      ORDER BY u.user_id;
    `;

    const reminderDate = new Date().toISOString().slice(0, 10);
    const createEventLink = `${getAppBaseUrl(req)}/dashboard/create-event`;
    const supportEmail = process.env.SUPPORT_EMAIL || process.env.SES_FROM_EMAIL || "support@localmetrics.com";
    const results = await Promise.allSettled(candidates.map((candidate) => queuePartnerInactiveEmail({
      partnerId: candidate.partner_id,
      toEmail: candidate.email,
      firstName: candidate.first_name,
      partnerName: candidate.partner_name,
      createEventLink,
      supportEmail,
      reminderDate,
    })));

    const queued = results.filter((result) => result.status === "fulfilled" && result.value).length;
    const skipped = results.length - queued;
    if (skipped) {
      console.error(`Failed to queue ${skipped} inactive-partner reminder(s)`);
    }

    return res.status(200).json({ queued, skipped });
  } catch (error) {
    console.error("schedule-partner-inactive error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to schedule inactive-partner reminders",
    });
  }
}
