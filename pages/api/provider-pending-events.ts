import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { resolveDashboardAccount } from "../../lib/dashboard-account";

type ProviderPendingEventsResponse =
  | {
      events: Array<{
        inviteId: string;
        eventId: string;
        providerId: string;
        partnerId: string;
        eventTitle: string;
        eventDescription: string;
        eventDate: string;
        eventTime: string;
        location: string;
        networkPoints: number;
        deadline: string;
        partnerName: string;
        status: string;
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
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProviderPendingEventsResponse>
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
        status: "pending",
      },
      orderBy: [{ invited_at: "desc" }],
      select: {
        invite_id: true,
        event_id: true,
        provider_id: true,
        partner_id: true,
        status: true,
        events: {
          select: {
            event_id: true,
            title: true,
            description: true,
            start_date: true,
            event_time: true,
            location: true,
            network_points: true,
            response_deadline: true,
            users: {
              select: {
                user_id: true,
                partner_profiles: {
                  select: {
                    org_name: true,
                  },
                },
                email: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      events: invites.map((invite) => ({
        inviteId: invite.invite_id,
        eventId: invite.event_id,
        providerId: invite.provider_id,
        partnerId: invite.partner_id,
        eventTitle: invite.events.title ?? "Untitled Event",
        eventDescription: invite.events.description ?? "",
        eventDate: formatDate(invite.events.start_date),
        eventTime: invite.events.event_time ?? "",
        location: invite.events.location ?? "",
        networkPoints: invite.events.network_points ?? 0,
        deadline: formatDate(invite.events.response_deadline),
        partnerName: invite.events.users.partner_profiles?.org_name ?? invite.events.users.email ?? "Partner",
        status: invite.status,
      })),
    });
  } catch (error) {
    console.error("provider-pending-events error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch provider pending events",
    });
  }
}
