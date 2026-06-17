import type { NextApiRequest, NextApiResponse } from "next";
import { randomInt } from "crypto";
import { prisma } from "../../lib/prisma";

type CreateEventResponse =
  | {
      message: string;
      eventId: string;
    }
  | {
      error: string;
    };

function setCorsHeaders(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");
}

function parseDate(value: unknown, fieldName: string) {
  if (!value) {
    return null;
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid date`);
  }

  return date;
}

function parseNumber(value: unknown) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error("networkPoints must be a valid number");
  }

  return Math.trunc(parsed);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateEventResponse>
) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body ?? {};
    const partnerId = String(body.partnerId ?? "").trim();
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "");
    const location = String(body.location ?? "").trim();
    const eventTime = String(body.eventTime ?? "").trim();
    const rawProviderIds = Array.isArray(body.providerIds) ? (body.providerIds as unknown[]) : [];
    const providerIds: string[] = rawProviderIds.length
      ? [...new Set(rawProviderIds.map((value) => String(value).trim()).filter((value): value is string => Boolean(value)))]
      : [];
    const startDate = parseDate(body.startDate, "startDate");
    const endDate = parseDate(body.endDate, "endDate");
    const responseDeadline = parseDate(body.responseDeadline, "responseDeadline");
    const networkPoints = parseNumber(body.networkPoints);

    if (!partnerId || !title || !startDate || !location || providerIds.length === 0) {
      return res.status(400).json({
        error: "partnerId, title, startDate, location, and at least one provider are required",
      });
    }

    const eventId = `EVT-${randomInt(100000, 999999)}`;

    const providerCount = await prisma.provider_profiles.count({
      where: {
        partner_id: partnerId,
        users: {
          user_type: "provider",
          user_id: {
            in: providerIds,
          },
        },
      },
    });

    if (providerCount !== providerIds.length) {
      return res.status(400).json({
        error: "One or more selected providers are not linked to this partner",
      });
    }

    const event = await prisma.$transaction(async (tx) => {
      const createdEvent = await tx.events.create({
        data: {
          event_id: eventId,
          partner_id: partnerId,
          title,
          description,
          location,
          event_time: eventTime || null,
          network_points: networkPoints,
          response_deadline: responseDeadline,
          start_date: startDate,
          end_date: endDate,
          status: "pending",
        },
        select: {
          event_id: true,
        },
      });

      await tx.event_provider_invites.createMany({
        data: providerIds.map((providerId) => ({
          event_id: createdEvent.event_id,
          provider_id: providerId,
          partner_id: partnerId,
          status: "pending",
        })),
        skipDuplicates: true,
      });

      return createdEvent;
    });

    return res.status(200).json({
      message: "Event created",
      eventId: event.event_id,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create event",
    });
  }
}
