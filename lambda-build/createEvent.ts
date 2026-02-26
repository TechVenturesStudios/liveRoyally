// backend/createEvent.ts
import { Client } from "pg";
import { randomInt } from "crypto";

export const handler = async (event: any = {}) => {
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
  };

  try {
    const method = event.httpMethod || event.requestContext?.http?.method;
    if (method === "OPTIONS") {
      return { statusCode: 200, headers, body: "" };
    }

    const body = event.body ? JSON.parse(event.body) : {};

    const {
      partnerId,   // users.user_id (uuid)
      title,
      description,
      startDate,   // "YYYY-MM-DD"
      endDate,     // "YYYY-MM-DD" (optional – can be deadline or event end)
    } = body;

    if (!partnerId || !title || !startDate) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "partnerId, title, and startDate are required" }),
      };
    }

    const client = new Client({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || "5432", 10),
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    // Create a simple event id like "EVT-123456"
    const eventId = `EVT-${randomInt(100000, 999999)}`;

    const sql = `
      INSERT INTO events (
        event_id,
        partner_id,
        title,
        description,
        start_date,
        end_date,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING event_id, created_at;
    `;

    const res = await client.query(sql, [
      eventId,
      partnerId,
      title,
      description || "",
      startDate,
      endDate || null,
    ]);

    await client.end();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Event created",
        eventId: res.rows[0].event_id,
      }),
    };
  } catch (err) {
    console.error("Error creating event:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to create event" }),
    };
  }
};
