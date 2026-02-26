// backend/getMemberPurchaseHistory.ts
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

    const memberId =
      event.queryStringParameters?.memberId ||
      event.queryStringParameters?.member_id;

    if (!memberId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing memberId" }),
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

    // Purchases that count as "used" history
    const USED_STATUSES = ["used", "redeemed", "completed"];

    // ✅ IMPORTANT: alias purchase_date as used_at to match frontend
    const sql = `
      SELECT
        p.purchase_id,
        p.member_id,
        p.voucher_id,
        p.purchase_date AS used_at,
        p.status        AS purchase_status,

        v.event_id,
        v.provider_id,
        v.type,
        v.value,
        v.expiration_date,
        v.status     AS voucher_status,
        v.created_at AS voucher_created_at,
        v.promo_item,

        e.title      AS event_title,
        e.start_date AS event_start_date,
        e.end_date   AS event_end_date,
        e.status     AS event_status,

        pr.business_name    AS provider_name,
        pr.business_address AS provider_address,
        pr.business_phone   AS provider_phone,
        pr.network_name     AS provider_network
      FROM purchases p
      JOIN vouchers v
        ON v.voucher_id = p.voucher_id
      LEFT JOIN events e
        ON e.event_id = v.event_id
      LEFT JOIN provider_profiles pr
        ON pr.user_id = v.provider_id
      WHERE p.member_id = $1
        AND lower(coalesce(p.status,'')) = ANY($2::text[])
      ORDER BY p.purchase_date DESC;
    `;

    const result = await client.query(sql, [memberId, USED_STATUSES]);

    await client.end();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ purchases: result.rows }),
    };
  } catch (err: any) {
    console.error("getMemberPurchaseHistory error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to fetch purchase history" }),
    };
  }
};
