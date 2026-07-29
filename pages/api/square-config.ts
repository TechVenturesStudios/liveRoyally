import type { NextApiRequest, NextApiResponse } from "next";

type SquareConfigResponse =
  | {
      applicationId: string;
      locationId: string;
      environment: string;
    }
  | {
      error: string;
    };

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<SquareConfigResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const applicationId = String(process.env.SQUARE_APP_ID || "").trim();
  const locationId = String(process.env.SQUARE_LOCATION_ID || "").trim();
  const environment = String(process.env.SQUARE_ENVIRONMENT || "sandbox").trim().toLowerCase();

  if (!applicationId) {
    return res.status(500).json({ error: "Missing env var SQUARE_APP_ID" });
  }

  if (!locationId) {
    return res.status(500).json({ error: "Missing env var SQUARE_LOCATION_ID" });
  }

  return res.status(200).json({
    applicationId,
    locationId,
    environment,
  });
}
