import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";

type ValidatePartnerCodeResponse =
  | {
      partner: {
        id: string;
        partnerCode: string;
        organizationName: string | null;
        name: string | null;
        networkName: string | null;
        networkCode: string | null;
      };
    }
  | {
      error: string;
    };

function setCorsHeaders(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ValidatePartnerCodeResponse>
) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const partnerCode = String(req.query.partnerCode || req.query.code || "")
      .trim()
      .toUpperCase();

    if (!partnerCode) {
      return res.status(400).json({ error: "partnerCode is required" });
    }

    const partner = await prisma.partner_profiles.findUnique({
      where: { partner_code: partnerCode },
      select: {
        user_id: true,
        partner_code: true,
        org_name: true,
        network_name: true,
        network_code: true,
      },
    });

    if (!partner?.partner_code) {
      return res.status(404).json({ error: "Partner code not found" });
    }

    return res.status(200).json({
      partner: {
        id: partner.user_id,
        partnerCode: partner.partner_code,
        organizationName: partner.org_name,
        name: partner.org_name,
        networkName: partner.network_name,
        networkCode: partner.network_code,
      },
    });
  } catch (error) {
    console.error("validate-partner-code error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to validate partner code",
    });
  }
}
