// backend/registerPartner.ts

import { Client } from "pg";
import { randomInt } from "crypto";

export const handler = async (event: any = {}) => {
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
  };

  try {
    const method = event.httpMethod || event.requestContext?.http?.method;
    if (method === "OPTIONS") {
      return { statusCode: 200, headers, body: "" };
    }

    const body = event.body ? JSON.parse(event.body) : {};

    const client = new Client({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || "5432", 10),
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    // Generate a random 9-digit display ID prefixed with P-
    const displayId = `P-${randomInt(100000000, 999999999)}`;

    // 1) Insert into users table
    const userInsert = `
      INSERT INTO users (
        cognito_id,
        email,
        first_name,
        last_name,
        phone_number,
        user_type,
        display_id
      )
      VALUES ($1, $2, $3, $4, $5, 'partner', $6)
      RETURNING user_id;
    `;

    const userRes = await client.query(userInsert, [
      body.cognitoId,
      body.organizationEmail,     // login email
      body.agentFirstName,
      body.agentLastName,
      body.agentPhone,
      displayId,
    ]);

    const userId = userRes.rows[0].user_id;

    // 2) Add role mapping
    const roleRes = await client.query(
      `SELECT role_id FROM roles WHERE role_name = 'partner';`
    );

    const roleId = roleRes.rows[0].role_id;

    await client.query(
      `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2);`,
      [userId, roleId]
    );

    // 3) Insert into partner_profiles
    const profileInsert = `
    INSERT INTO partner_profiles (
        user_id,
        network_name,
        network_code,
        agent_first_name,
        agent_last_name,
        agent_phone,
        org_name,
        org_address,
        org_email,
        org_phone,
        notification_enabled,
        terms_accepted
    )
    VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12
    );
    `;

    await client.query(profileInsert, [
    userId,
    body.networkName,
    body.networkCode,
    body.agentFirstName,
    body.agentLastName,
    body.agentPhone,
    body.organizationName,      // → org_name
    body.organizationAddress,   // → org_address
    body.organizationEmail,     // → org_email
    body.organizationPhone,     // → org_phone
    body.notificationEnabled,
    body.termsAccepted,
    ]);


    await client.end();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Partner registered successfully",
        userId,
        displayId,
      }),
    };
  } catch (err) {
    console.error("Error registering partner:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to register partner" }),
    };
  }
};
