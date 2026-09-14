import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { resolveDashboardAccount } from "../../../lib/dashboard-account";
import { deriveEventLifecycleStatus } from "@/utils/eventStatus";

type MetricRow = { members_invited: bigint | number | string | null; members_attended: bigint | number | string | null; revenue: unknown };

const toNumber = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatDate = (value: Date | null | undefined) => value ? value.toISOString().slice(0, 10) : "";
const networkKey = (code: string | null | undefined, name: string | null | undefined) =>
  code?.trim() || name?.trim() || "Unassigned Network";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const account = await resolveDashboardAccount(req, ["admin"]);
    if (!account) return res.status(500).json({ error: "Failed to resolve account" });
    if ("error" in account) return res.status(account.status).json({ error: account.error });

    const partners = await prisma.users.findMany({
      where: { user_type: "partner" },
      orderBy: { created_at: "asc" },
      select: {
        user_id: true,
        partner_profiles: { select: { org_name: true, network_name: true, network_code: true } },
        partner_providers: { select: { user_id: true, business_name: true, business_category: true, agent_first_name: true, agent_last_name: true } },
        events: {
          orderBy: [{ start_date: "desc" }, { created_at: "desc" }],
          select: {
            event_id: true, title: true, description: true, location: true, event_time: true,
            start_date: true, end_date: true, response_deadline: true,
            event_provider_invites: {
              orderBy: { invited_at: "desc" },
              select: { provider_id: true, status: true, provider: { select: { provider_profiles: { select: { business_name: true, business_category: true, agent_first_name: true, agent_last_name: true } } } } },
            },
          },
        },
      },
    });

    const networks = new Map<string, { name: string; code: string; partners: Map<string, { name: string; events: any[] }> }>();

    for (const partner of partners) {
      const profile = partner.partner_profiles;
      const code = networkKey(profile?.network_code, profile?.network_name);
      const network = networks.get(code) ?? { name: profile?.network_name?.trim() || code, code, partners: new Map() };
      const partnerName = profile?.org_name?.trim() || "Unnamed partner";
      const partnerData = network.partners.get(partner.user_id) ?? { name: partnerName, events: [] };

      for (const event of partner.events) {
        const status = deriveEventLifecycleStatus({ startDate: event.start_date, endDate: event.end_date, responseDeadline: event.response_deadline, inviteStatuses: event.event_provider_invites.map((invite) => invite.status) });
        if (status !== "completed") continue;

        const metrics = await prisma.$queryRaw<MetricRow[]>`
          WITH voucher_base AS (SELECT voucher_id, COALESCE(member_price, 0) AS member_price FROM vouchers WHERE event_id = ${event.event_id}),
          claims AS (SELECT mv.voucher_id, COUNT(DISTINCT mv.member_id) AS count FROM member_vouchers mv INNER JOIN voucher_base vb ON vb.voucher_id = mv.voucher_id GROUP BY mv.voucher_id),
          purchase_counts AS (SELECT p.voucher_id, COUNT(DISTINCT p.purchase_id) FILTER (WHERE LOWER(TRIM(COALESCE(p.status, ''))) IN ('used', 'redeemed', 'completed')) AS count FROM purchases p INNER JOIN voucher_base vb ON vb.voucher_id = p.voucher_id GROUP BY p.voucher_id)
          SELECT COALESCE(SUM(c.count), 0)::bigint AS members_invited, COALESCE(SUM(p.count), 0)::bigint AS members_attended,
            COALESCE(SUM(vb.member_price * COALESCE(p.count, 0)), 0)::numeric AS revenue
          FROM voucher_base vb LEFT JOIN claims c ON c.voucher_id = vb.voucher_id LEFT JOIN purchase_counts p ON p.voucher_id = vb.voucher_id
        `;
        const metric = metrics[0];
        const acceptedProviderCount = new Set(
          event.event_provider_invites
            .filter((invite) => invite.status === "accepted")
            .map((invite) => invite.provider_id),
        ).size;
        partnerData.events.push({ id: event.event_id, title: event.title || "Untitled Event", date: formatDate(event.start_date), time: event.event_time || "", location: event.location || "", description: event.description || "", membersInvited: toNumber(metric?.members_invited), membersAttended: toNumber(metric?.members_attended), revenue: toNumber(metric?.revenue), acceptedProviderCount });
      }

      if (partnerData.events.length > 0) network.partners.set(partner.user_id, partnerData);
      networks.set(code, network);
    }

    return res.status(200).json({ networks: Array.from(networks.values()).map((network) => ({ name: network.name, code: network.code, partners: Array.from(network.partners.values()) })) });
  } catch (error) {
    console.error("admin historical events error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load historical events" });
  }
}
