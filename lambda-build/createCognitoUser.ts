import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

function headers() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
  };
}

async function getSub(cognito: CognitoIdentityProviderClient, userPoolId: string, username: string) {
  const res = await cognito.send(
    new AdminGetUserCommand({ UserPoolId: userPoolId, Username: username })
  );
  const sub = res.UserAttributes?.find((a) => a.Name === "sub")?.Value;
  if (!sub) throw new Error("Could not read Cognito sub for created user");
  return sub;
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

    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    if (!userPoolId) throw new Error("Missing env var COGNITO_USER_POOL_ID");

    const region = process.env.AWS_REGION || "us-east-2";
    const cognito = new CognitoIdentityProviderClient({ region });

    const username = String(body.email || "").toLowerCase().trim();
    if (!username) return { statusCode: 400, headers: h, body: JSON.stringify({ error: "email is required" }) };

    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();

    const rawPhone = body.phoneNumber ? String(body.phoneNumber).trim() : "";
    const phone = rawPhone
      ? (rawPhone.startsWith("+") ? rawPhone : `+1${rawPhone.replace(/\D/g, "")}`)
      : undefined;

    await cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: username,
        DesiredDeliveryMediums: ["EMAIL"],
        UserAttributes: [
          { Name: "email", Value: username },
          { Name: "email_verified", Value: "true" },
          ...(firstName || lastName ? [{ Name: "name", Value: `${firstName} ${lastName}`.trim() }] : []),
          ...(phone ? [{ Name: "phone_number", Value: phone }] : []),
          { Name: "custom:userType", Value: String(body.userType || "member") },
        ],
      })
    );

    const cognitoSub = await getSub(cognito, userPoolId, username);

    return {
      statusCode: 200,
      headers: h,
      body: JSON.stringify({ cognitoSub, username }),
    };
  } catch (err: any) {
    console.error(err);
    return { statusCode: 500, headers: h, body: JSON.stringify({ error: err?.message || "Failed to create Cognito user" }) };
  }
};