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
    const startDate = parseDate(body.startDate, "startDate");
    const endDate = parseDate(body.endDate, "endDate");

    if (!partnerId || !title || !startDate) {
      return res.status(400).json({
        error: "partnerId, title, and startDate are required",
      });
    }

    const eventId = `EVT-${randomInt(100000, 999999)}`;

    const event = await prisma.events.create({
      data: {
        event_id: eventId,
        partner_id: partnerId,
        title,
        description,
        start_date: startDate,
        end_date: endDate,
        status: "pending",
      },
      select: {
        event_id: true,
      },
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
