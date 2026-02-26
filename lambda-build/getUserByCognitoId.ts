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

    const cognitoId =
      event.queryStringParameters?.cognitoId ||
      event.queryStringParameters?.cognito_id; 

    if (!cognitoId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing cognitoId" }),
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

    const query = `
      SELECT
        u.user_id,
        u.cognito_id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone_number,
        u.user_type,
        u.display_id,
        json_build_object(
          -- common (member/provider/partner share these)
          'networkName', COALESCE(mp.network_name, pvp.network_name, pp.network_name),
          'networkCode', COALESCE(mp.network_code, pvp.network_code, pp.network_code),
          'notificationEnabled', COALESCE(mp.notification_enabled, pvp.notification_enabled, pp.notification_enabled),
          'termsAccepted', COALESCE(mp.terms_accepted, pvp.terms_accepted, pp.terms_accepted),

          -- member-specific
          'zipCode', mp.zip_code,
          'ethnicity', mp.ethnicity,
          'ageGroup', mp.age_group,
          'gender', mp.gender,

          -- provider-specific
          'agentFirstName', pvp.agent_first_name,
          'agentLastName', pvp.agent_last_name,
          'agentPhone', pvp.agent_phone,
          'businessName', pvp.business_name,
          'businessCategory', pvp.business_category,
          'businessAddress', pvp.business_address,
          'businessEmail', pvp.business_email,
          'businessPhone', pvp.business_phone,

          -- partner-specific (THIS was missing before)
          'partnerAgentFirstName', pp.agent_first_name,
          'partnerAgentLastName', pp.agent_last_name,
          'partnerAgentPhone', pp.agent_phone,
          'organizationName', pp.org_name,
          'organizationAddress', pp.org_address,
          'organizationEmail', pp.org_email,
          'organizationPhone', pp.org_phone
        ) AS profile
      FROM users u
      LEFT JOIN member_profiles   mp  ON mp.user_id  = u.user_id
      LEFT JOIN provider_profiles pvp ON pvp.user_id = u.user_id
      LEFT JOIN partner_profiles  pp  ON pp.user_id  = u.user_id
      WHERE u.cognito_id = $1
      LIMIT 1;
    `;

    const result = await client.query(query, [cognitoId]);
    await client.end();

    if (result.rowCount === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    const row = result.rows[0];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user_id: row.user_id,
        cognito_id: row.cognito_id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        phone_number: row.phone_number,
        user_type: row.user_type,
        display_id: row.display_id,
        profile: row.profile,
      }),
    };
  } catch (err: any) {
    console.error("getUserByCognitoId error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to fetch user profile" }),
    };
  }
};
