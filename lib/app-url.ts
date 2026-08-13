import type { NextApiRequest } from "next";

function cleanBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function getAppBaseUrl(req?: NextApiRequest) {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.SITE_URL ||
    "";

  if (configuredUrl.trim()) {
    return cleanBaseUrl(configuredUrl);
  }

  if (req) {
    const forwardedProto = Array.isArray(req.headers["x-forwarded-proto"])
      ? req.headers["x-forwarded-proto"][0]
      : req.headers["x-forwarded-proto"];
    const forwardedHost = Array.isArray(req.headers["x-forwarded-host"])
      ? req.headers["x-forwarded-host"][0]
      : req.headers["x-forwarded-host"];
    const host = forwardedHost || req.headers.host;
    const protocol = forwardedProto || "http";

    if (host) {
      return `${protocol}://${host}`;
    }
  }

  return "http://localhost:3000";
}

