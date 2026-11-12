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
    const cognitoId = await getCognitoIdFromCookie(req);
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

    let locationId: string | null = null;
    try {
      const locationsResponse = await fetch(`${squareOauthApiBaseUrl}/v2/locations`, {
        headers: {
          Authorization: `Bearer ${payload.access_token}`,
          Accept: "application/json",
          "Square-Version": process.env.SQUARE_VERSION || "2026-09-16",
        },
      });
      const locationsPayload = await locationsResponse.json().catch(() => null) as {
        locations?: Array<{ id?: string; status?: string }>;
        errors?: Array<{ category?: string; code?: string; detail?: string }>;
      } | null;

      if (!locationsResponse.ok) {
        const details = locationsPayload?.errors?.map((error) => error.detail || error.code || error.category || "Unknown error").join("; ") || "Unknown Square error";
        throw new Error(`Square locations request failed (${locationsResponse.status}): ${details}`);
      }

      const activeLocation = locationsPayload?.locations?.find(
        (location) => String(location.status || "").toUpperCase() === "ACTIVE" && location.id
      );

      if (!activeLocation?.id) {
        throw new Error("Square returned no active location for the connected merchant");
      }

      locationId = activeLocation.id;
    } catch (locationError) {
      console.error("Square location lookup failed", {
        merchantId: payload.merchant_id,
        error: locationError instanceof Error ? locationError.message : locationError,
      });
      return finish(res, "location_error");
    }

    await prisma.partner_square_connections.upsert({
      where: { user_id: user.user_id },
      create: {
        user_id: user.user_id,
        merchant_id: payload.merchant_id,
        location_id: locationId,
        access_token_ciphertext: encryptSquareToken(payload.access_token),
        refresh_token_ciphertext: encryptSquareToken(payload.refresh_token),
        access_token_expires_at: payload.expires_at ? new Date(payload.expires_at) : null,
        scopes: payload.scopes?.join(" ") || null,
      },
      update: {
        merchant_id: payload.merchant_id,
        location_id: locationId,
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
