import type { NextApiRequest } from "next";
import { CognitoJwtVerifier } from "aws-jwt-verify";

export function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce<Record<string, string>>((cookies, cookie) => {
    const [rawName, ...rawValue] = cookie.trim().split("=");

    if (!rawName) {
      return cookies;
    }

    try {
      cookies[rawName] = decodeURIComponent(rawValue.join("="));
    } catch {
      cookies[rawName] = rawValue.join("=");
    }
    return cookies;
  }, {});
}

let idTokenVerifier: ReturnType<typeof createIdTokenVerifier> | null = null;

function createIdTokenVerifier() {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;

  if (!userPoolId || !clientId) {
    throw new Error("Missing Cognito environment configuration");
  }

  return CognitoJwtVerifier.create({ userPoolId, clientId, tokenUse: "id" });
}

// Returns the Cognito user id (sub) only when the token's signature, issuer, audience
// and expiry check out against the user pool's published keys.
export async function verifyIdToken(idToken: string) {
  idTokenVerifier ??= createIdTokenVerifier();

  try {
    const payload = await idTokenVerifier.verify(idToken);
    return payload.sub;
  } catch {
    return null;
  }
}

export async function getCognitoIdFromCookie(req: NextApiRequest) {
  const idToken = parseCookies(req.headers.cookie).lr_id_token;
  return idToken ? verifyIdToken(idToken) : null;
}

// The signed-in user is identified only by the verified session cookie. Ids sent in the
// query string or body are never trusted.
export function getCognitoIdFromRequest(req: NextApiRequest) {
  return getCognitoIdFromCookie(req);
}
