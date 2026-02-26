import { Client } from "pg";

const headers = {
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
};

export const handler = async (event: any = {}) => {
  try {
    const method = event.httpMethod || event.requestContext?.http?.method;
    if (method === "OPTIONS") return { statusCode: 200, headers, body: "" };
    if (method !== "POST") {
      return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    const body = JSON.parse(event.body || "{}");
    const memberId = body.memberId;
    const voucherId = body.voucherId;

    if (!memberId || !voucherId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing memberId or voucherId" }) };
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

    await client.query(
      `
      INSERT INTO member_vouchers (member_id, voucher_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
      [memberId, voucherId]
    );

    await client.end();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("saveMemberVoucher error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to save voucher" }),
    };
  }
};
