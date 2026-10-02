import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { getAppBaseUrl } from "../../../lib/app-url";
import { queueVoucherExpiringSoonEmail } from "../../../lib/notification-templates";

type ExpiringVoucherCandidate = {
  voucher_id: string;
  event_id: string;
  member_id: string;
  email: string;
  first_name: string | null;
  event_name: string;
  voucher_name: string;
  expiration_date: Date;
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

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
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
    const candidates = await prisma.$queryRaw<ExpiringVoucherCandidate[]>`
      SELECT
        v.voucher_id,
        e.event_id,
        u.user_id AS member_id,
        u.email,
        u.first_name,
        COALESCE(NULLIF(TRIM(e.title), ''), 'your event') AS event_name,
        COALESCE(NULLIF(TRIM(v.promo_item), ''), NULLIF(TRIM(e.title), ''), 'Local Metrics voucher') AS voucher_name,
        v.expiration_date
      FROM vouchers v
      JOIN events e ON e.event_id = v.event_id
      JOIN provider_profiles pp ON pp.user_id = v.provider_id
      JOIN users u ON u.user_type = 'member'
      JOIN member_profiles mp ON mp.user_id = u.user_id
      WHERE e.published = TRUE
        AND e.end_date = (CURRENT_DATE + INTERVAL '3 days')::date
        AND v.expiration_date = (CURRENT_DATE + INTERVAL '3 days')::date
        AND LOWER(TRIM(COALESCE(v.status, ''))) = 'active'
        AND NULLIF(TRIM(u.email), '') IS NOT NULL
        AND mp.notification_enabled = TRUE
        AND mp.network_code = pp.network_code
        AND NOT EXISTS (
          SELECT 1
          FROM member_vouchers mv
          WHERE mv.member_id = u.user_id
            AND mv.voucher_id = v.voucher_id
        )
      ORDER BY v.voucher_id, u.user_id;
    `;

    const claimBaseUrl = `${getAppBaseUrl(req)}/dashboard/deals`;
    const results = await Promise.allSettled(candidates.map((candidate) => queueVoucherExpiringSoonEmail({
      voucherId: candidate.voucher_id,
      memberId: candidate.member_id,
      toEmail: candidate.email,
      firstName: candidate.first_name,
      eventName: candidate.event_name?.trim() || "your event",
      voucherName: candidate.voucher_name,
      expirationDate: formatDate(candidate.expiration_date),
      daysRemaining: 3,
      claimLink: `${claimBaseUrl}?eventId=${encodeURIComponent(candidate.event_id)}`,
    })));

    const queued = results.filter((result) => result.status === "fulfilled").length;
    const skipped = results.length - queued;
    if (skipped) {
      console.error(`Failed to queue ${skipped} voucher expiration reminder(s)`);
    }

    return res.status(200).json({ queued, skipped });
  } catch (error) {
    console.error("schedule-voucher-expiring error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to schedule voucher expiration reminders",
    });
  }
}
