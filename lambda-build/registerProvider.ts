// backend/registerProvider.ts
import { Client } from "pg";
import { randomInt } from "crypto";

export const handler = async (event: any = {}) => {
  try {
    const method = event.httpMethod || event.requestContext?.http?.method || "POST";
    if (method === "OPTIONS") {
      return { statusCode: 200, headers: { "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "OPTIONS,POST" }, body: "" };
    }

    const body = event.body ? JSON.parse(event.body) : {};

    const client = new Client({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT),
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    // Step 1: Generate display ID (9 digits, prefixed with P-)
    const displayId = `P-${randomInt(100000000, 999999999)}`;

    // Step 2: Insert into users table
    const userInsert = `
      INSERT INTO users (
        cognito_id, email, first_name, last_name, phone_number, user_type, display_id
      )
      VALUES ($1, $2, $3, $4, $5, 'provider', $6)
      RETURNING user_id;
    `;
    
    const userRes = await client.query(userInsert, [
      body.cognitoId,
      body.businessEmail,
      body.agentFirstName,
      body.agentLastName,
      body.agentPhone,
      displayId
    ]);

    const userId = userRes.rows[0].user_id;

    // Step 3: Add provider role
    const roleRes = await client.query(`SELECT role_id FROM roles WHERE role_name = 'provider';`);
    const roleId = roleRes.rows[0].role_id;

    await client.query(
      `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2);`,
      [userId, roleId]
    );

    // Step 4: Insert provider profile
    const insertProfile = `
      INSERT INTO provider_profiles (
        user_id, network_name, network_code,
        business_name, business_category, business_address,
        business_email, business_phone,
        agent_first_name, agent_last_name, agent_phone,
        notification_enabled, terms_accepted
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13);
    `;

    await client.query(insertProfile, [
      userId,
      body.networkName,
      body.networkCode,
      body.businessName,
      body.businessCategory || null,
      body.businessAddress || null,
      body.businessEmail,
      body.businessPhone || null,
      body.agentFirstName,
      body.agentLastName,
      body.agentPhone,
      body.notificationEnabled ?? false,
      body.termsAccepted
    ]);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Provider registered successfully",
        userId,
        displayId,
      }),
    };

  } catch (err: any) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to register provider" }),
    };
  }
};
