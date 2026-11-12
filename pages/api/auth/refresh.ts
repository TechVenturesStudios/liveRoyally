import type { NextApiRequest, NextApiResponse } from "next";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { parseCookies, verifyIdToken } from "../../../lib/api-auth";
import {
  ACCESS_TOKEN_COOKIE,
  authCookie,
  clearCookie,
  ID_TOKEN_COOKIE,
  isSecureRequest,
  REFRESH_TOKEN_COOKIE,
  SESSION_COOKIE_MAX_AGE,
} from "../../../lib/auth-cookies";

// Exchanges the long-lived refresh token cookie for a new ID and access token so a
// signed-in user stays signed in after the one-hour ID token expires.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secure = isSecureRequest(req);
  const refreshToken = parseCookies(req.headers.cookie)[REFRESH_TOKEN_COOKIE];

  if (!refreshToken) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const clientId = process.env.COGNITO_CLIENT_ID;
    if (!clientId) {
      throw new Error("Missing Cognito environment configuration");
    }

    const cognito = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION || "us-east-2",
    });
    const auth = await cognito.send(
      new InitiateAuthCommand({
        ClientId: clientId,
        AuthFlow: "REFRESH_TOKEN_AUTH",
        AuthParameters: { REFRESH_TOKEN: refreshToken },
      })
    );

    const idToken = auth.AuthenticationResult?.IdToken;
    const accessToken = auth.AuthenticationResult?.AccessToken;
    if (!idToken || !accessToken || !(await verifyIdToken(idToken))) {
      throw new Error("Cognito did not return a valid session");
    }

    res.setHeader("Set-Cookie", [
      authCookie(ID_TOKEN_COOKIE, idToken, SESSION_COOKIE_MAX_AGE, secure),
      authCookie(ACCESS_TOKEN_COOKIE, accessToken, SESSION_COOKIE_MAX_AGE, secure),
    ]);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);

    res.setHeader("Set-Cookie", [
      clearCookie(ID_TOKEN_COOKIE, secure),
      clearCookie(ACCESS_TOKEN_COOKIE, secure),
      clearCookie(REFRESH_TOKEN_COOKIE, secure),
    ]);

    return res.status(401).json({ error: "Your session has expired. Please sign in again." });
  }
}
