import type { NextApiRequest, NextApiResponse } from "next";
import { randomInt } from "crypto";
import { prisma } from "../../lib/prisma";
import { getAppBaseUrl } from "../../lib/app-url";
import { sendSesSimpleEmail } from "../../lib/ses-email";

type CreateEventResponse =
  | {
      message: string;
      eventId: string;
      notifications?: {
        sent: number;
        failed: number;
      };
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

    const [partner, providers] = await Promise.all([
      prisma.users.findUnique({
        where: { user_id: partnerId },
        select: {
          email: true,
          first_name: true,
          last_name: true,
          partner_profiles: {
            select: {
              org_name: true,
            },
          },
        },
      }),
      prisma.users.findMany({
        where: {
          user_id: {
            in: providerIds,
          },
        },
        select: {
          user_id: true,
          email: true,
          first_name: true,
          last_name: true,
          provider_profiles: {
            select: {
              business_email: true,
              business_name: true,
            },
          },
        },
      }),
    ]);

    const partnerName =
      partner?.partner_profiles?.org_name?.trim() ||
      [partner?.first_name, partner?.last_name].filter(Boolean).join(" ").trim() ||
      partner?.email?.trim() ||
      "Your partner";
    const pendingEventsUrl = new URL("/dashboard/provider-pending-events", getAppBaseUrl(req)).toString();

    const emailResults = await Promise.allSettled(
      providers.map(async (provider) => {
        const recipientEmail =
          provider.provider_profiles?.business_email?.trim() ||
          provider.email.trim();

        const providerName =
          provider.provider_profiles?.business_name?.trim() ||
          [provider.first_name, provider.last_name].filter(Boolean).join(" ").trim() ||
          recipientEmail;

        const eventTitle = title.trim();
        const eventDate = String(body.startDate).trim();
        const eventTimeLabel = eventTime || "TBD";
        const locationLabel = location.trim();
        const subject = `Event invitation from ${partnerName}`;
        const textBody = [
          `Hello ${providerName},`,
          "",
          `${partnerName} invited you to "${eventTitle}" on Live Royally.`,
          "",
          `Event date: ${eventDate}`,
          `Time: ${eventTimeLabel}`,
          `Location: ${locationLabel}`,
          "",
          `Review the invitation and accept or decline it here: ${pendingEventsUrl}`,
          "",
          "If you were not expecting this invitation, you can ignore this email.",
        ].join("\n");
        const htmlBody = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
            <p>Hello ${escapeHtml(providerName)},</p>
            <p><strong>${escapeHtml(partnerName)}</strong> invited you to <strong>${escapeHtml(eventTitle)}</strong> on Live Royally.</p>
            <ul>
              <li><strong>Event date:</strong> ${escapeHtml(eventDate)}</li>
              <li><strong>Time:</strong> ${escapeHtml(eventTimeLabel)}</li>
              <li><strong>Location:</strong> ${escapeHtml(locationLabel)}</li>
            </ul>
            <p>
              <a href="${pendingEventsUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;">
                View pending events
              </a>
            </p>
            <p>If you were not expecting this invitation, you can ignore this email.</p>
          </div>
        `;

        return sendSesSimpleEmail({
          toEmail: recipientEmail,
          subject,
          textBody,
          htmlBody,
        });
      })
    );

    const sent = emailResults.filter((result) => result.status === "fulfilled").length;
    const failed = emailResults.length - sent;

    return res.status(200).json({
      message: "Event created",
      eventId: event.event_id,
      notifications: {
        sent,
        failed,
      },
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create event",
    });
  }
}
