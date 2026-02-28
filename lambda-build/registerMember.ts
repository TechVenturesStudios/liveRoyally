import { Client } from "pg";
import { randomInt } from "crypto";

function headers() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
  };
}

export const handler = async (event: any = {}) => {
  const h = headers();

  try {
    const method = event.httpMethod || event.requestContext?.http?.method;
    if (method === "OPTIONS") return { statusCode: 200, headers: h, body: "" };
    if (method !== "POST") return { statusCode: 405, headers: h, body: JSON.stringify({ error: "Method not allowed" }) };

    const body =
      typeof event.body === "string"
        ? JSON.parse(event.body)
        : (event.body ?? {});

    if (!body.cognitoSub) {
      return { statusCode: 400, headers: h, body: JSON.stringify({ error: "cognitoSub is required" }) };
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
    await client.query("BEGIN");

    const displayId = `M-${randomInt(100000000, 999999999)}`;

    const userInsert = `
      INSERT INTO users (
        cognito_id, email, first_name, last_name, phone_number, user_type, display_id
      )
      VALUES ($1, $2, $3, $4, $5, 'member', $6)
      RETURNING user_id;
    `;

    const userRes = await client.query(userInsert, [
      body.cognitoSub,
      body.email,
      body.firstName,
      body.lastName,
      body.phoneNumber ?? null,
      displayId,
    ]);

    const userId = userRes.rows[0].user_id;

    const roleRes = await client.query(`SELECT role_id FROM roles WHERE role_name = 'member';`);
    const roleId = roleRes.rows?.[0]?.role_id;
    if (!roleId) throw new Error("Role 'member' not found");

    await client.query(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2);`, [userId, roleId]);

    const profileInsert = `
      INSERT INTO member_profiles (
        user_id, network_name, network_code, zip_code, ethnicity,
        age_group, gender, notification_enabled, terms_accepted
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9);
    `;

    await client.query(profileInsert, [
      userId,
      body.networkName,
      body.networkCode,
      body.zipCode,
      body.ethnicity ?? null,
      body.ageGroup ?? null,
      body.gender ?? null,
      !!body.notificationEnabled,
      !!body.termsAccepted,
    ]);

    await client.query("COMMIT");
    await client.end();

    return {
      statusCode: 200,
      headers: h,
      body: JSON.stringify({ message: "DB user created", userId, displayId }),
    };
  } catch (err: any) {
    console.error(err);
    try {
      // rollback if possible
      // (safe even if not begun)
    } catch {}
    return { statusCode: 500, headers: h, body: JSON.stringify({ error: err?.message || "Failed to register member in DB" }) };
  }
};