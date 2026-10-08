import type { NextApiRequest, NextApiResponse } from "next";
import { resolveDashboardAccount } from "../../../../lib/dashboard-account";
import {
  createSquareOauthState,
  squareOauthAuthorizeUrl,
  squareOauthRedirectUri,
  squareOauthScopes,
} from "../../../../lib/square-oauth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const account = await resolveDashboardAccount({ ...req, query: {} } as NextApiRequest, ["partner"]);
    if (!account) return res.status(401).json({ error: "Not authenticated" });
    if ("error" in account) return res.status(account.status).json({ error: account.error });

    const state = createSquareOauthState();
    const secure = process.env.NODE_ENV === "production";
    res.setHeader("Set-Cookie", `square_oauth_state=${encodeURIComponent(state)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure ? "; Secure" : ""}`);
    const url = new URL(squareOauthAuthorizeUrl);
    url.searchParams.set("client_id", String(process.env.SQUARE_APP_ID || "").trim());
    url.searchParams.set("scope", squareOauthScopes.join(" "));
    url.searchParams.set("session", "false");
    url.searchParams.set("state", state);
    url.searchParams.set("redirect_uri", squareOauthRedirectUri());
    return res.redirect(302, url.toString());
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Unable to start Square connection" });
  }
}
