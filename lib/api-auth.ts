import type { NextApiRequest } from "next";

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce<Record<string, string>>((cookies, cookie) => {
    const [rawName, ...rawValue] = cookie.trim().split("=");

    if (!rawName) {
      return cookies;
    }

    cookies[rawName] = decodeURIComponent(rawValue.join("="));
    return cookies;
  }, {});
}

export function getCognitoIdFromRequest(req: NextApiRequest) {
  const queryCognitoId = String(req.query.cognitoId || req.query.cognito_id || "").trim();

  if (queryCognitoId) {
    return queryCognitoId;
  }

  const cookies = parseCookies(req.headers.cookie);
  const idToken = cookies.lr_id_token;

  if (!idToken) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(idToken.split(".")[1], "base64url").toString("utf8")
    ) as { sub?: string };

    return payload.sub ?? null;
  } catch {
    return null;
  }
}
