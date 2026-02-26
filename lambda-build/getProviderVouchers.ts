// backend/getProviderVouchers.ts
import { Client } from "pg";

const headers = {
  
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,GET",
};

export const handler = async (event: any = {}) => {
  let client: Client | null = null;

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

    const providerId =
      event.queryStringParameters?.providerId ||
      event.queryStringParameters?.provider_id;

    const eventId =
      event.queryStringParameters?.eventId ||
      event.queryStringParameters?.event_id ||
      null;

    if (!providerId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing providerId" }),
      };
    }

    client = new Client({
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
        v.voucher_id,
        v.event_id,
        v.provider_id,
        v.type,
        v.value,
        v.expiration_date,
        v.status,
        v.created_at,
        v.promo_item,

        e.title       AS event_title,
        e.start_date  AS event_start_date,
        e.end_date    AS event_end_date,
        e.status      AS event_status
      FROM vouchers v
      LEFT JOIN events e ON e.event_id = v.event_id
      WHERE v.provider_id = $1
        AND ($2::text IS NULL OR v.event_id = $2)
      ORDER BY v.created_at DESC;
    `;

    const result = await client.query(sql, [providerId, eventId]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ vouchers: result.rows }),
    };
  } catch (err: any) {
    console.error("getProviderVouchers error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to fetch provider vouchers" }),
    };
  } finally {
    if (client) {
      try {
        await client.end();
      } catch {}
    }
  }
};
