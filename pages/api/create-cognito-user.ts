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

function isAtLeastSixteen(birthday: unknown) {
  if (typeof birthday !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) return false;
  const date = new Date(`${birthday}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== birthday) return false;
  const today = new Date();
  const cutoff = new Date(Date.UTC(today.getUTCFullYear() - 16, today.getUTCMonth(), today.getUTCDate()));
  return date <= cutoff;
}

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

    // Only members provide a birthday and are subject to the member age rule.
    // Providers and partners register business/organization accounts and do not
    // need to provide a birthday.
    if (body.userType === "member" && !isAtLeastSixteen(body.birthday)) {
      return res.status(400).json({ error: "You must be at least 16 years old to create an account" });
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
