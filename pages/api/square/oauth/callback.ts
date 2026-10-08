import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";
import { getCognitoIdFromCookie } from "../../../../lib/api-auth";
import { encryptSquareToken, squareOauthApiBaseUrl, squareOauthRedirectUri, type SquareTokenResponse } from "../../../../lib/square-oauth";

function cookieValue(req: NextApiRequest, name: string) {
  return (req.headers.cookie || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

function finish(res: NextApiResponse, result: string) {
  const secure = process.env.NODE_ENV === "production";
  res.setHeader("Set-Cookie", `square_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`);
  return res.redirect(302, `/dashboard/profile?square=${encodeURIComponent(result)}`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  try {
    const state = String(req.query.state || "");
    const expectedState = cookieValue(req, "square_oauth_state");
    if (!state || !expectedState || state !== decodeURIComponent(expectedState)) return finish(res, "state_error");
    const cognitoId = getCognitoIdFromCookie(req);
    if (!cognitoId) return finish(res, "auth_error");
    if (req.query.error) return finish(res, "denied");

    const code = String(req.query.code || "");
    if (!code) return finish(res, "code_error");
    const user = await prisma.users.findUnique({ where: { cognito_id: cognitoId }, select: { user_id: true, user_type: true } });
    if (!user || user.user_type !== "partner") return finish(res, "forbidden");

    const tokenResponse = await fetch(`${squareOauthApiBaseUrl}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Square-Version": process.env.SQUARE_VERSION || "2026-09-16" },
      body: JSON.stringify({
        client_id: String(process.env.SQUARE_APP_ID || "").trim(),
        client_secret: String(process.env.SQUARE_APPLICATION_SECRET || "").trim(),
        code,
        grant_type: "authorization_code",
        redirect_uri: squareOauthRedirectUri(),
      }),
    });
    const payload = await tokenResponse.json() as SquareTokenResponse;
    if (!tokenResponse.ok || !payload.access_token || !payload.refresh_token || !payload.merchant_id) {
      console.error("Square OAuth token exchange failed", { status: tokenResponse.status, error: payload.error });
      return finish(res, "exchange_error");
    }

    await prisma.partner_square_connections.upsert({
      where: { user_id: user.user_id },
      create: {
        user_id: user.user_id,
        merchant_id: payload.merchant_id,
        access_token_ciphertext: encryptSquareToken(payload.access_token),
        refresh_token_ciphertext: encryptSquareToken(payload.refresh_token),
        access_token_expires_at: payload.expires_at ? new Date(payload.expires_at) : null,
        scopes: payload.scopes?.join(" ") || null,
      },
      update: {
        merchant_id: payload.merchant_id,
        access_token_ciphertext: encryptSquareToken(payload.access_token),
        refresh_token_ciphertext: encryptSquareToken(payload.refresh_token),
        access_token_expires_at: payload.expires_at ? new Date(payload.expires_at) : null,
        scopes: payload.scopes?.join(" ") || null,
        updated_at: new Date(),
      },
    });
    return finish(res, "connected");
  } catch (error) {
    console.error("Square OAuth callback failed", error);
    return finish(res, "error");
  }
}
