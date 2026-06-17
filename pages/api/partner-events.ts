import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { resolveDashboardAccount } from "../../lib/dashboard-account";

type PartnerEventsResponse =
  | {
      events: Array<{
        id: string;
        title: string;
        description: string;
        date: string;
        time: string;
        location: string;
        networkPoints: number;
        createdDate: string;
        responseDeadline: string;
        status: string;
        stage: "needs_approval" | "upcoming" | "past";
        providerCount: number;
        pendingProviderCount: number;
        acceptedProviderCount: number;
        declinedProviderCount: number;
        providers: Array<{
          inviteId: string;
          providerId: string;
          providerName: string;
          providerCategory: string;
          status: string;
          invitedAt: string | null;
          respondedAt: string | null;
        }>;
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

function isBeforeToday(value: Date | string | null | undefined) {
  if (!value) return false;
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PartnerEventsResponse>
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

    return res.status(200).json({
      events: events.map((event) => {
        const pendingProviderCount = event.event_provider_invites.filter((invite) => invite.status === "pending").length;
        const acceptedProviderCount = event.event_provider_invites.filter((invite) => invite.status === "accepted").length;
        const declinedProviderCount = event.event_provider_invites.filter((invite) => invite.status === "declined").length;
        const stage = pendingProviderCount > 0
          ? "needs_approval"
          : isBeforeToday(event.start_date)
            ? "past"
            : "upcoming";

        return {
          id: event.event_id,
          title: event.title ?? "Untitled Event",
          description: event.description ?? "",
          date: formatDate(event.start_date),
          time: event.event_time ?? "",
          location: event.location ?? "",
          networkPoints: event.network_points ?? 0,
          createdDate: formatDate(event.created_at),
          responseDeadline: formatDate(event.response_deadline),
          status: event.status ?? "pending",
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
        };
      }),
    });
  } catch (error) {
    console.error("partner-events error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch partner events",
    });
  }
}
