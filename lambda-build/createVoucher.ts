import { Client } from "pg";

const headers = {
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
};

type UiVoucherType = "P" | "A" | "F";
type DbVoucherType = "A" | "B" | "C";

export const handler = async (event: any = {}) => {
  let client: Client | null = null;

  try {
    const method = event.httpMethod || event.requestContext?.http?.method;

    if (method === "OPTIONS") {
      return { statusCode: 200, headers, body: "" };
    }

    if (method !== "POST") {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const body = event.body ? JSON.parse(event.body) : {};

    const eventId = String(body.eventId ?? "").trim();
    const providerId = String(body.providerId ?? "").trim();
    const uiType = String(body.type ?? "").trim().toUpperCase() as UiVoucherType;
    const expirationDate = body.expirationDate ? String(body.expirationDate) : null;

    const valueRaw = body.value;
    const promoItemRaw = body.promoItem;

    if (!eventId || !providerId || !uiType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing eventId, providerId, or type" }),
      };
    }

    if (!["P", "A", "F"].includes(uiType)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid voucher type. Use P, A, or F." }),
      };
    }

    // 🔁 Map UI → DB
    const dbType: DbVoucherType =
      uiType === "P" ? "A" :
      uiType === "A" ? "B" :
      "C";

    // ---------- Validate value ----------
    let value: number = 0;
    let promoItem: string | null = null;

    if (uiType === "P") {
      const n = Number(valueRaw);
      if (!Number.isFinite(n) || n <= 0 || n > 100) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Percent discount must be between 1 and 100" }),
        };
      }
      value = n;
    }

    if (uiType === "A") {
      const n = Number(valueRaw);
      if (!Number.isFinite(n) || n <= 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Amount discount must be greater than 0" }),
        };
      }
      value = n;
    }

    if (uiType === "F") {
      if (typeof promoItemRaw !== "string" || promoItemRaw.trim() === "") {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "promoItem is required for free-item vouchers" }),
        };
      }
      promoItem = promoItemRaw.trim();
      value = 0;
    }

    // ---------- DB ----------
    client = new Client({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || "5432", 10),
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    // ✅ 1) Prevent re-signup:
    // If ANY voucher exists for this provider+event, they already "signed up".
    // Return the newest existing voucher (any status).
    const existingSql = `
      SELECT
        voucher_id,
        event_id,
        provider_id,
        type,
        value,
        expiration_date,
        status,
        promo_item,
        created_at
      FROM vouchers
      WHERE provider_id = $1
        AND event_id = $2
      ORDER BY created_at DESC
      LIMIT 1;
    `;

    const existingRes = await client.query(existingSql, [providerId, eventId]);

    if (existingRes.rowCount && existingRes.rows[0]) {
      // If you ever want to "re-activate" after redeemed/expired, you could do it here.
      // But based on your requirement: DO NOT allow sign up again.
      await client.end();
      client = null;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          voucher: existingRes.rows[0],
          alreadySignedUp: true,
        }),
      };
    }

    // ✅ 2) Create new voucher (first signup only)
    const voucherId = `V-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

    const insertSql = `
      INSERT INTO vouchers (
        voucher_id,
        event_id,
        provider_id,
        type,
        value,
        expiration_date,
        status,
        promo_item
      )
      VALUES ($1,$2,$3,$4,$5,$6,'active',$7)
      RETURNING
        voucher_id,
        event_id,
        provider_id,
        type,
        value,
        expiration_date,
        status,
        promo_item,
        created_at;
    `;

    const params = [
      voucherId,
      eventId,
      providerId,
      dbType,
      value,
      expirationDate,
      promoItem,
    ];

    const result = await client.query(insertSql, params);

    await client.end();
    client = null;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ voucher: result.rows[0], alreadySignedUp: false }),
    };
  } catch (err: any) {
    console.error("createVoucher error:", err);
    try {
      if (client) await client.end();
    } catch {}
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to create voucher" }),
    };
  }
};
