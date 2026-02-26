// backend/getPartnerEvents.ts
import { Client } from "pg";

export const handler = async (event: any = {}) => {
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,GET",
  };

  try {
    const method = event.httpMethod || event.requestContext?.http?.method;
    if (method === "OPTIONS") {
      return { statusCode: 200, headers, body: "" };
    }

    const partnerId =
      event.queryStringParameters?.partnerId ||
      event.queryStringParameters?.partner_id;

    if (!partnerId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing partnerId" }),
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

    const sql = `
      SELECT
        event_id,
        title,
        description,
        start_date,
        end_date,
        status,
        created_at
      FROM events
      WHERE partner_id = $1
      ORDER BY start_date DESC, created_at DESC;
    `;

    const res = await client.query(sql, [partnerId]);

    await client.end();

    // Shape to match your frontend structure
    const events = res.rows.map((row) => ({
      id: row.event_id,
      title: row.title,
      description: row.description,
      // your UI expects "date" and "deadline"
      date: row.start_date,          // Date of event
      deadline: row.end_date,        // Treat end_date as deadline for now
      status: row.status || "pending",
      purchaseCount: 0,              // you don't have purchase_count column yet
      contacts: [],                  // we’ll wire real contacts later
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ events }),
    };
  } catch (err) {
    console.error("Error fetching partner events:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to fetch events" }),
    };
  }
};
