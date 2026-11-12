import type { NextApiRequest } from "next";

export const ID_TOKEN_COOKIE = "lr_id_token";
export const ACCESS_TOKEN_COOKIE = "lr_access_token";
export const REFRESH_TOKEN_COOKIE = "lr_refresh_token";

export const SESSION_COOKIE_MAX_AGE = 60 * 60;
export const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function isSecureRequest(req: NextApiRequest) {
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim().toLowerCase();
  return forwardedProto === "https";
}

export function authCookie(name: string, value: string, maxAge: number, secure: boolean) {
  const secureFlag = secure ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secureFlag}`;
}

export function clearCookie(name: string, secure: boolean) {
  const secureFlag = secure ? "; Secure" : "";
  return `${name}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secureFlag}`;
}
