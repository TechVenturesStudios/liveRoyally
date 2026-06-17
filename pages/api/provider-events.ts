import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { resolveDashboardAccount } from "../../lib/dashboard-account";

type ProviderEventsResponse =
  | {
      events: Array<{
        id: string;
        title: string;
        description: string;
        date: string;
        time: string;
        location: string;
        organizer: string;
        partner: string;
        status: "pending" | "active" | "completed";
        participated: boolean;
        networkScore: number;
        approvedDate: string | null;
        goLiveDate: string | null;
        inviteStatus: string;
        voucherId: string | null;
        memberPrice: number | null;
        maxRedemptions: number | null;
        redemptions: number;
      }>;
    }
  | {
      error: string;
    };

function setCorsHeaders(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET");
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function classifyEventStatus(inviteStatus: string, eventDate: Date | string | null | undefined) {
  if (inviteStatus === "pending") {
    return "pending" as const;
  }

  const date = eventDate ? new Date(eventDate) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return "active" as const;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date < today ? ("completed" as const) : ("active" as const);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProviderEventsResponse>
) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const account = await resolveDashboardAccount(req, ["provider"]);
    if (!account) {
      return res.status(500).json({ error: "Failed to resolve account" });
    }
    if ("error" in account) {
      return res.status(account.status).json({ error: account.error });
    }

    const invites = await prisma.event_provider_invites.findMany({
      where: {
        provider_id: account.actingUserId,
        status: {
          in: ["pending", "accepted", "declined", "expired"],
        },
      },
      orderBy: [{ invited_at: "desc" }],
      select: {
        invite_id: true,
        status: true,
        responded_at: true,
        voucher_id: true,
        events: {
          select: {
            event_id: true,
            title: true,
            description: true,
            start_date: true,
            event_time: true,
            location: true,
            network_points: true,
            status: true,
            users: {
              select: {
                email: true,
                partner_profiles: {
                  select: {
                    org_name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const events = await Promise.all(invites.map(async (invite) => {
      const eventDate = formatDate(invite.events.start_date);
      const inviteStatus = invite.status;
      const status = classifyEventStatus(inviteStatus, invite.events.start_date);
      const voucher = await prisma.vouchers.findFirst({
        where: {
          event_id: invite.events.event_id,
          provider_id: account.actingUserId,
        },
        select: {
          voucher_id: true,
          member_price: true,
          max_redemptions: true,
        },
      });

      const redemptions = voucher
        ? await prisma.purchases.count({
            where: {
              voucher_id: voucher.voucher_id,
            },
          })
        : 0;

      return {
        id: invite.invite_id,
        title: invite.events.title ?? "Untitled Event",
        description: invite.events.description ?? "",
        date: eventDate ?? "",
        time: invite.events.event_time ?? "",
        location: invite.events.location ?? "",
        organizer: invite.events.users.partner_profiles?.org_name ?? invite.events.users.email ?? "Partner",
        partner: invite.events.users.partner_profiles?.org_name ?? invite.events.users.email ?? "Partner",
        status,
        participated: status === "completed" ? redemptions > 0 : false,
        networkScore: invite.events.network_points ?? 0,
        approvedDate: formatDate(invite.responded_at),
        goLiveDate: eventDate,
        inviteStatus,
        voucherId: invite.voucher_id ?? voucher?.voucher_id ?? null,
        memberPrice: voucher?.member_price ?? null,
        maxRedemptions: voucher?.max_redemptions ?? null,
        redemptions,
      };
    }));

    return res.status(200).json({ events });
  } catch (error) {
    console.error("provider-events error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch provider events",
    });
  }
}
