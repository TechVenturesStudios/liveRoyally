// backend/claimMemberVoucher.ts
import { Client } from "pg";

const headers = {
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
};

export const handler = async (event: any = {}) => {
  const method = event.httpMethod || event.requestContext?.http?.method;

  // CORS
  if (method === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (method !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const memberId = String(body.memberId || "").trim();
    const voucherId = String(body.voucherId || "").trim();

    if (!memberId || !voucherId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing memberId or voucherId" }) };
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

    // Use a transaction so we don't partially update
    await client.query("BEGIN");

    // 1) Validate voucher exists + active + not expired
    const vRes = await client.query(
      `
      SELECT voucher_id, status, expiration_date
      FROM vouchers
      WHERE voucher_id = $1
      `,
      [voucherId]
    );

    if (vRes.rowCount === 0) {
      await client.query("ROLLBACK");
      await client.end();
      return { statusCode: 404, headers, body: JSON.stringify({ error: "Voucher not found" }) };
    }

    const voucher = vRes.rows[0];
    const vStatus = String(voucher.status || "").toLowerCase();

    if (vStatus !== "active") {
      await client.query("ROLLBACK");
      await client.end();
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Voucher is not active" }) };
    }

    if (voucher.expiration_date) {
      const exp = new Date(voucher.expiration_date);
      const today = new Date();
      // normalize to date-only compare
      exp.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (exp < today) {
        await client.query("ROLLBACK");
        await client.end();
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Voucher is expired" }) };
      }
    }

    // 2) Ensure member actually selected it (optional but recommended)
    // If you don't want this check, you can remove it.
    const selRes = await client.query(
      `
      SELECT 1
      FROM member_vouchers
      WHERE member_id = $1 AND voucher_id = $2
      `,
      [memberId, voucherId]
    );

    if (selRes.rowCount === 0) {
      await client.query("ROLLBACK");
      await client.end();
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Voucher is not in member upcoming list" }),
      };
    }

    // 3) Insert purchase
    // Your purchases schema likely has purchase_id (serial/bigserial), member_id, voucher_id, purchase_date, status
    const purchaseInsert = await client.query(
      `
      INSERT INTO purchases (member_id, voucher_id, purchase_date, status)
      VALUES ($1, $2, NOW(), 'redeemed')
      RETURNING purchase_id, member_id, voucher_id, purchase_date, status;
      `,
      [memberId, voucherId]
    );

    // 4) Remove from upcoming list
    await client.query(
      `
      DELETE FROM member_vouchers
      WHERE member_id = $1 AND voucher_id = $2
      `,
      [memberId, voucherId]
    );

    // 5) Optional: mark voucher as redeemed so nobody can reuse
    // If you want multi-use vouchers, delete this update.
    await client.query(
      `
      UPDATE vouchers
      SET status = 'redeemed'
      WHERE voucher_id = $1
      `,
      [voucherId]
    );

    await client.query("COMMIT");
    await client.end();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ purchase: purchaseInsert.rows[0] }),
    };
  } catch (err: any) {
    console.error("claimMemberVoucher error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to claim voucher" }),
    };
  }
};
