// backend/getProviderEvents.ts
import { Client } from "pg";

const headers = {
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,GET",
};

export const handler = async (event: any = {}) => {
  try {
    const method = event.httpMethod || event.requestContext?.http?.method;
    if (method === "OPTIONS") return { statusCode: 200, headers, body: "" };

    if (method !== "GET") {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: "Method not allowed" }),
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

    // ✅ organizer comes from partner_profiles.org_name via events.partner_id
    const sql = `
      SELECT
        e.event_id,
        e.title,
        e.start_date,
        e.end_date,
        e.status,
        e.created_at,
        COALESCE(pp.org_name, '') AS organizer
      FROM events e
      LEFT JOIN partner_profiles pp
        ON pp.user_id = e.partner_id
      WHERE e.status = 'published'
        AND COALESCE(e.end_date, e.start_date) >= CURRENT_DATE
      ORDER BY e.start_date ASC, e.created_at DESC;
    `;

    const res = await client.query(sql);
    await client.end();

    const events = res.rows.map((row: any) => ({
      id: row.event_id,
      title: row.title,
      date: row.start_date,
      deadline: row.end_date ?? null,
      status: row.status || "published",

      // keep existing compatibility fields used elsewhere
      purchaseCount: 0,
      contacts: [],

      // ✅ add these so your pending page can show organizer
      organizer: row.organizer || "",
      organizers: row.organizer ? [row.organizer] : [],

      // safe defaults (your UI expects these keys)
      description: "",
      location: "",
      time: "",
      participated: false,
      networkScore: 0,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ events }),
    };
  } catch (err: any) {
    console.error("Error fetching provider events:", err?.message || err, err?.stack);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to fetch events for provider",
        detail: err?.message || "unknown",
      }),
    };
  }
};
