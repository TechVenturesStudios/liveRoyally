import type { NextApiRequest, NextApiResponse } from "next";
import { createOrGetCognitoUser, mapCognitoError } from "../../lib/cognito-admin";

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
    const body = req.body ?? {};
    const email = String(body.email || "").trim();

    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    const { cognitoSub, username } = await createOrGetCognitoUser({
      email,
      firstName: body.firstName,
      lastName: body.lastName,
      phoneNumber: body.phoneNumber,
      userType: body.userType,
    });

    return res.status(200).json({ cognitoSub, username });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: mapCognitoError(error),
    });
  }
}
