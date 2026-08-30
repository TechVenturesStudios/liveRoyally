import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { resolveDashboardAccount } from "../../lib/dashboard-account";
import type { PartnerEventAnalytics } from "@/api/partnerEvents";
import { deriveEventLifecycleStatus, normalizeEventStage } from "@/utils/eventStatus";

type PartnerEventAnalyticsResponse =
  | {
      events: PartnerEventAnalytics[];
    }
  | {
      error: string;
    };

type AnalyticsMetricsRow = {
  members_invited: bigint | number | string | null;
  members_attended: bigint | number | string | null;
  target_revenue: unknown;
  revenue: unknown;
};

function setCorsHeaders(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET");
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PartnerEventAnalyticsResponse>
) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const account = await resolveDashboardAccount(req, ["partner"]);
    if (!account) {
      return res.status(500).json({ error: "Failed to resolve account" });
    }

    if ("error" in account) {
      return res.status(account.status).json({ error: account.error });
    }

    const events = await prisma.events.findMany({
      where: {
        partner_id: account.actingUserId,
      },
      orderBy: [{ created_at: "desc" }, { start_date: "desc" }],
      select: {
        event_id: true,
        title: true,
        description: true,
        location: true,
        event_time: true,
        network_points: true,
        response_deadline: true,
        start_date: true,
        end_date: true,
        status: true,
        created_at: true,
        event_provider_invites: {
          orderBy: [{ invited_at: "desc" }],
          select: {
            invite_id: true,
            provider_id: true,
            status: true,
            invited_at: true,
            responded_at: true,
            provider: {
              select: {
                user_id: true,
                email: true,
                provider_profiles: {
                  select: {
                    business_name: true,
                    business_category: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const analyticsEvents: PartnerEventAnalytics[] = [];

    for (const event of events) {
      const status = deriveEventLifecycleStatus({
        startDate: event.start_date,
        endDate: event.end_date,
        responseDeadline: event.response_deadline,
        inviteStatuses: event.event_provider_invites.map((invite) => invite.status),
      });

      if (event.status !== status) {
        await prisma.events.update({
          where: { event_id: event.event_id },
          data: { status },
        });
      }

      const pendingProviderCount = event.event_provider_invites.filter((invite) => invite.status === "pending").length;
      const acceptedProviderCount = event.event_provider_invites.filter((invite) => invite.status === "accepted").length;
      const declinedProviderCount = event.event_provider_invites.filter((invite) => invite.status === "declined").length;
      const stage = normalizeEventStage(status);

      if (status !== "completed") {
        continue;
      }

      const primaryInvite = event.event_provider_invites.find((invite) => invite.status === "accepted") ?? event.event_provider_invites[0];

      const metrics = await prisma.$queryRaw<AnalyticsMetricsRow[]>`
        WITH voucher_base AS (
          SELECT
            v.voucher_id,
            COALESCE(v.member_price, 0) AS member_price
          FROM vouchers v
          WHERE v.event_id = ${event.event_id}
        ),
        claim_counts AS (
          SELECT
            mv.voucher_id,
            COUNT(DISTINCT mv.member_id) AS claim_count
          FROM member_vouchers mv
          INNER JOIN voucher_base vb ON vb.voucher_id = mv.voucher_id
          GROUP BY mv.voucher_id
        ),
        purchase_counts AS (
          SELECT
            p.voucher_id,
            COUNT(DISTINCT p.purchase_id) FILTER (
              WHERE LOWER(COALESCE(p.status, 'completed')) NOT IN ('refunded', 'cancelled', 'canceled')
            ) AS purchase_count
          FROM purchases p
          INNER JOIN voucher_base vb ON vb.voucher_id = p.voucher_id
          GROUP BY p.voucher_id
        )
        SELECT
          COALESCE(SUM(cc.claim_count), 0)::bigint AS members_invited,
          COALESCE(SUM(pc.purchase_count), 0)::bigint AS members_attended,
          COALESCE(SUM(vb.member_price * COALESCE(cc.claim_count, 0)), 0)::numeric AS target_revenue,
          COALESCE(SUM(vb.member_price * COALESCE(pc.purchase_count, 0)), 0)::numeric AS revenue
        FROM voucher_base vb
        LEFT JOIN claim_counts cc ON cc.voucher_id = vb.voucher_id
        LEFT JOIN purchase_counts pc ON pc.voucher_id = vb.voucher_id
      `;

      const analytics = metrics[0] ?? {
        members_invited: 0,
        members_attended: 0,
        target_revenue: 0,
        revenue: 0,
      };

      analyticsEvents.push({
        id: event.event_id,
        title: event.title ?? "Untitled Event",
        description: event.description ?? "",
        date: formatDate(event.start_date),
        time: event.event_time ?? "",
        location: event.location ?? "",
        networkPoints: event.network_points ?? 0,
        createdDate: formatDate(event.created_at),
        responseDeadline: formatDate(event.response_deadline),
        status,
        stage,
        providerCount: event.event_provider_invites.length,
        pendingProviderCount,
        acceptedProviderCount,
        declinedProviderCount,
        providers: event.event_provider_invites.map((invite) => ({
          inviteId: invite.invite_id,
          providerId: invite.provider_id,
          providerName:
            invite.provider.provider_profiles?.business_name ??
            invite.provider.email ??
            "Unnamed Provider",
          providerCategory:
            invite.provider.provider_profiles?.business_category ?? "Other",
          status: invite.status,
          invitedAt: invite.invited_at ? invite.invited_at.toISOString() : null,
          respondedAt: invite.responded_at ? invite.responded_at.toISOString() : null,
        })),
        providerId: primaryInvite?.provider_id ?? event.event_id,
        providerName:
          primaryInvite?.provider.provider_profiles?.business_name ??
          primaryInvite?.provider.email ??
          "Unnamed Provider",
        membersAttended: toNumber(analytics.members_attended),
        membersInvited: toNumber(analytics.members_invited),
        revenue: toNumber(analytics.revenue),
        targetRevenue: toNumber(analytics.target_revenue),
        providerParticipated: acceptedProviderCount > 0,
      });
    }

    return res.status(200).json({ events: analyticsEvents });
  } catch (error) {
    console.error("partner-event-analytics error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch partner event analytics",
    });
  }
}
