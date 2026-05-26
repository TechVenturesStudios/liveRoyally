import type { NextApiRequest, NextApiResponse } from "next";
import {
  AdminCreateUserCommand,
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  isMissingAwsCredentialsError,
  missingAwsCredentialsMessage,
} from "../../lib/aws-errors";

type CreateCognitoUserResponse =
  | {
      cognitoSub: string;
      username: string;
    }
  | {
      error: string;
    };

function setCorsHeaders(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");
}

async function getSub(
  cognito: CognitoIdentityProviderClient,
  userPoolId: string,
  username: string
) {
  const response = await cognito.send(
    new AdminGetUserCommand({ UserPoolId: userPoolId, Username: username })
  );
  const sub = response.UserAttributes?.find((attribute) => attribute.Name === "sub")?.Value;

  if (!sub) {
    throw new Error("Could not read Cognito sub for created user");
  }

  return sub;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateCognitoUserResponse>
) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userPoolId = process.env.COGNITO_USER_POOL_ID;

    if (!userPoolId) {
      throw new Error("Missing env var COGNITO_USER_POOL_ID");
    }

    const body = req.body ?? {};
    const username = String(body.email || "").toLowerCase().trim();

    if (!username) {
      return res.status(400).json({ error: "email is required" });
    }

    const firstName = String(body.firstName || "").trim();
    const lastName = String(body.lastName || "").trim();
    const rawPhone = body.phoneNumber ? String(body.phoneNumber).trim() : "";
    const phone = rawPhone
      ? rawPhone.startsWith("+")
        ? rawPhone
        : `+1${rawPhone.replace(/\D/g, "")}`
      : undefined;

    const region = process.env.AWS_REGION || "us-east-2";
    const cognito = new CognitoIdentityProviderClient({ region });

    try {
      await cognito.send(
        new AdminCreateUserCommand({
          UserPoolId: userPoolId,
          Username: username,
          DesiredDeliveryMediums: ["EMAIL"],
          UserAttributes: [
            { Name: "email", Value: username },
            { Name: "email_verified", Value: "true" },
            ...(firstName || lastName
              ? [{ Name: "name", Value: `${firstName} ${lastName}`.trim() }]
              : []),
            ...(phone ? [{ Name: "phone_number", Value: phone }] : []),
            { Name: "custom:userType", Value: String(body.userType || "member") },
          ],
        })
      );
    } catch (error) {
      if (!(error instanceof Error) || error.name !== "UsernameExistsException") {
        throw error;
      }
    }

    const cognitoSub = await getSub(cognito, userPoolId, username);

    return res.status(200).json({ cognitoSub, username });
  } catch (error) {
    console.error(error);

    if (isMissingAwsCredentialsError(error)) {
      return res.status(500).json({
        error: missingAwsCredentialsMessage("create Cognito users"),
      });
    }

    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create Cognito user",
    });
  }
}
