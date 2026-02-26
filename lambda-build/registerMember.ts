// backend/registerMember.ts

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
      port: parseInt(process.env.DB_PORT || "5432"),
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    // Generate a random 9-digit display ID prefixed with M-
    const displayId = `M-${randomInt(100000000, 999999999)}`;

    // Step 1: Insert into users table
    const userInsert = `
      INSERT INTO users (
        cognito_id, email, first_name, last_name, phone_number, user_type, display_id
      )
      VALUES ($1, $2, $3, $4, $5, 'member', $6)
      RETURNING user_id;
    `;
    const userRes = await client.query(userInsert, [
      body.cognitoId,
      body.email,
      body.firstName,
      body.lastName,
      body.phoneNumber,
      displayId,
    ]);

    const userId = userRes.rows[0].user_id;

    // Step 2: Add role mapping
    const roleRes = await client.query(`SELECT role_id FROM roles WHERE role_name = 'member';`);
    const roleId = roleRes.rows[0].role_id;

    await client.query(
      `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2);`,
      [userId, roleId]
    );

    // Step 3: Insert into member_profiles
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
      body.ethnicity,
      body.ageGroup,
      body.gender,
      body.notificationEnabled,
      body.termsAccepted,
    ]);

    await client.end();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "Member registered successfully",
        userId,
        displayId,
      }),
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to register member" }),
    };
  }
};

//k
