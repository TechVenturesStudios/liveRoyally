import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { getAppBaseUrl } from "../../../lib/app-url";
import { queueCampaignResultsEmail } from "../../../lib/notification-templates";

function isAuthorized(req: NextApiRequest) {
  const expected = String(process.env.EMAIL_SCHEDULER_SECRET || "").trim();
  if (!expected) return false;
  const authorization = Array.isArray(req.headers.authorization) ? req.headers.authorization[0] : req.headers.authorization;
  const provided = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : String(req.headers["x-email-scheduler-secret"] || "").trim();
  return provided === expected;
}

function numberValue(value: bigint | number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!isAuthorized(req)) return res.status(401).json({ error: "Unauthorized" });

  try {
    const events = await prisma.$queryRaw<Array<{ event_id: string; title: string | null; partner_id: string | null }>>`
      SELECT event_id, title, partner_id FROM events
      WHERE end_date = (CURRENT_DATE - INTERVAL '1 day')::date
    `;
    const baseUrl = getAppBaseUrl(req);
    const results = await Promise.allSettled(events.filter((event) => event.partner_id).map(async (event) => {
      const partner = await prisma.users.findUnique({ where: { user_id: event.partner_id! }, select: { user_id: true, email: true, first_name: true } });
      if (!partner?.email) return null;
      const [metrics, providers] = await Promise.all([
        prisma.$queryRaw<Array<{ claimed: bigint | number | string; redeemed: bigint | number | string; reached: bigint | number | string }>>`
          SELECT COUNT(DISTINCT mv.member_id)::bigint AS reached,
            COUNT(DISTINCT mv.member_id)::bigint AS claimed,
            COUNT(DISTINCT p.purchase_id) FILTER (WHERE LOWER(TRIM(COALESCE(p.status, ''))) IN ('used', 'redeemed', 'completed'))::bigint AS redeemed
          FROM vouchers v
          LEFT JOIN member_vouchers mv ON mv.voucher_id = v.voucher_id
          LEFT JOIN purchases p ON p.voucher_id = v.voucher_id
          WHERE v.event_id = ${event.event_id}
        `,
        prisma.event_provider_invites.count({ where: { event_id: event.event_id, status: "accepted" } }),
      ]);
      const metric = metrics[0];
      return queueCampaignResultsEmail({
        eventId: event.event_id,
        partnerId: partner.user_id,
        toEmail: partner.email,
        firstName: partner.first_name,
        eventName: event.title?.trim() || "Your event",
        vouchersClaimed: numberValue(metric?.claimed),
        vouchersRedeemed: numberValue(metric?.redeemed),
        newMembersReached: numberValue(metric?.reached),
        providerCount: providers,
        createEventLink: `${baseUrl}/dashboard/create-event`,
      });
    }));
    return res.status(200).json({ queued: results.filter((result) => result.status === "fulfilled").length, failed: results.filter((result) => result.status === "rejected").length });
  } catch (error) {
    console.error("schedule-campaign-results error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to schedule campaign results" });
  }
}
