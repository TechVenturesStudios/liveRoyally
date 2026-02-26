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
      return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    const memberId =
      event.queryStringParameters?.memberId ||
      event.queryStringParameters?.member_id;

    if (!memberId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing memberId" }) };
    }

    const client = new Client({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT),
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    const result = await client.query(
      `
      SELECT
        v.*,
        e.title AS event_title,
        pp.business_name AS provider_name,
        pp.business_address AS provider_address,
        pp.business_phone AS provider_phone,
        pp.network_name AS provider_network
      FROM member_vouchers mv
      JOIN vouchers v ON v.voucher_id = mv.voucher_id
      LEFT JOIN events e ON e.event_id = v.event_id
      LEFT JOIN provider_profiles pp ON pp.user_id = v.provider_id
      WHERE mv.member_id = $1
        AND v.status = 'active'
      ORDER BY mv.created_at DESC
      `,
      [memberId]
    );

    await client.end();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ vouchers: result.rows }),
    };
  } catch (err) {
    console.error("getMemberUpcomingVouchers error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to fetch upcoming vouchers" }),
    };
  }
};
