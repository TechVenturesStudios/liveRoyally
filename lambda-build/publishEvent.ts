import { Client } from "pg";

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
    const { eventId, partnerId } = body;

    if (!eventId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing eventId" }),
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

    // If you want to enforce ownership, require partnerId and include it in WHERE.
    const sql = partnerId
      ? `UPDATE events
         SET status = 'published'
         WHERE event_id = $1 AND partner_id = $2
         RETURNING event_id, status;`
      : `UPDATE events
         SET status = 'published'
         WHERE event_id = $1
         RETURNING event_id, status;`;

    const params = partnerId ? [eventId, partnerId] : [eventId];
    const res = await client.query(sql, params);

    await client.end();

    if (res.rowCount === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: partnerId
            ? "Event not found (or not owned by this partner)"
            : "Event not found",
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Event published",
        event: res.rows[0],
      }),
    };
  } catch (err) {
    console.error("Error publishing event:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to publish event" }),
    };
  }
};
