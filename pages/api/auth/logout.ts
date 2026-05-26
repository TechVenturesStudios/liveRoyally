import type { NextApiRequest, NextApiResponse } from "next";

function clearCookie(name: string) {
  return `${name}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Set-Cookie", [
    clearCookie("lr_id_token"),
    clearCookie("lr_access_token"),
    clearCookie("lr_refresh_token"),
  ]);

  return res.status(200).json({ ok: true });
}
