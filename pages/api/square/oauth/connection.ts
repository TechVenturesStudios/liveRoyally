import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../lib/prisma";
import { resolveDashboardAccount } from "../../../../lib/dashboard-account";
import { decryptSquareToken, squareOauthApiBaseUrl } from "../../../../lib/square-oauth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const account = await resolveDashboardAccount({ ...req, query: {} } as NextApiRequest, ["partner"]);
    if (!account) return res.status(401).json({ error: "Not authenticated" });
    if ("error" in account) return res.status(account.status).json({ error: account.error });
    const connection = await prisma.partner_square_connections.findUnique({ where: { user_id: account.actingUserId } });
    if (req.method === "GET") {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ connected: Boolean(connection), connectedAt: connection?.connected_at ?? null, merchantId: connection?.merchant_id ?? null });
    }
    if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });
    if (connection?.access_token_ciphertext) {
      const revokeResponse = await fetch(`${squareOauthApiBaseUrl}/oauth2/revoke`, {
        method: "POST",
        headers: {
          Authorization: `Client ${String(process.env.SQUARE_APPLICATION_SECRET || "").trim()}`,
          "Content-Type": "application/json",
          "Square-Version": process.env.SQUARE_VERSION || "2026-09-16",
        },
        body: JSON.stringify({ client_id: String(process.env.SQUARE_APP_ID || "").trim(), access_token: decryptSquareToken(connection.access_token_ciphertext) }),
      });
      if (!revokeResponse.ok) return res.status(502).json({ error: "Square did not accept the disconnect request" });
    }
    await prisma.partner_square_connections.deleteMany({ where: { user_id: account.actingUserId } });
    return res.status(200).json({ connected: false });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "Unable to manage Square connection" });
  }
}
