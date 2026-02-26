// backend/getMemberVouchers.ts
import { Client } from "pg";

const headers = {
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,GET",
};

export const handler = async (event: any = {}) => {
  try {
    const method = event.httpMethod || event.requestContext?.http?.method;

    // CORS preflight
    if (method === "OPTIONS") {
      return { statusCode: 200, headers, body: "" };
    }

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

    // NOTE:
    // - v.type is A/B/C in DB
    // - status filter is case/space tolerant
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

        pp.business_name     AS provider_name,
        pp.business_address  AS provider_address,
        pp.business_phone    AS provider_phone,
        pp.network_name      AS provider_network
      FROM vouchers v
      LEFT JOIN events e
        ON e.event_id = v.event_id
      LEFT JOIN provider_profiles pp
        ON pp.user_id = v.provider_id
      WHERE LOWER(TRIM(v.status)) = 'active'
      ORDER BY v.created_at DESC;
    `;

    const result = await client.query(sql);
    await client.end();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ vouchers: result.rows }),
    };
  } catch (err: any) {
    console.error("getMemberVouchers error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to fetch active vouchers" }),
    };
  }
};