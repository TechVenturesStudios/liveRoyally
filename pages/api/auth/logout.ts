import type { NextApiRequest, NextApiResponse } from "next";

function isSecureRequest(req: NextApiRequest) {
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim().toLowerCase();
  return forwardedProto === "https";
}

function clearCookie(name: string, secure: boolean) {
  const secureFlag = secure ? "; Secure" : "";
  return `${name}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secureFlag}`;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secure = isSecureRequest(req);

  res.setHeader("Set-Cookie", [
    clearCookie("lr_id_token", secure),
    clearCookie("lr_access_token", secure),
    clearCookie("lr_refresh_token", secure),
  ]);

  return res.status(200).json({ ok: true });
}
