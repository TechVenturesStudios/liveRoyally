import type { NextApiRequest, NextApiResponse } from "next";
import {
  ACCESS_TOKEN_COOKIE,
  clearCookie,
  ID_TOKEN_COOKIE,
  isSecureRequest,
  REFRESH_TOKEN_COOKIE,
} from "../../../lib/auth-cookies";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secure = isSecureRequest(req);

  res.setHeader("Set-Cookie", [
    clearCookie(ID_TOKEN_COOKIE, secure),
    clearCookie(ACCESS_TOKEN_COOKIE, secure),
    clearCookie(REFRESH_TOKEN_COOKIE, secure),
  ]);

  return res.status(200).json({ ok: true });
}
