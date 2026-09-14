import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { resolveDashboardAccount } from "../../lib/dashboard-account";

type PublishEventResponse =
  | { event: { id: string; published: boolean; publishedAt: string } }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublishEventResponse>
) {
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const account = await resolveDashboardAccount(req, ["partner"]);
    if (!account) return res.status(500).json({ error: "Failed to resolve account" });
    if ("error" in account) return res.status(account.status).json({ error: account.error });

    const eventId = String(req.body?.eventId ?? "").trim();
    if (!eventId) return res.status(400).json({ error: "eventId is required" });

    const event = await prisma.events.updateMany({
      where: { event_id: eventId, partner_id: account.actingUserId, published: false },
      data: { published: true, published_at: new Date() },
    });

    if (event.count === 0) {
      const existing = await prisma.events.findFirst({
        where: { event_id: eventId, partner_id: account.actingUserId },
        select: { published: true },
      });
      if (!existing) return res.status(404).json({ error: "Event not found" });
      return res.status(200).json({
        event: { id: eventId, published: true, publishedAt: new Date().toISOString() },
      });
    }

    return res.status(200).json({
      event: { id: eventId, published: true, publishedAt: new Date().toISOString() },
    });
  } catch (error) {
    console.error("publish-event error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to publish event" });
  }
}
