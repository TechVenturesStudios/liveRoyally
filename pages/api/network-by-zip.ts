import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";

type NetworkByZipResponse =
  | {
      zipCode: string;
      parish: string | null;
      networkName: string;
      networkCode: string;
      state: string | null;
    }
  | {
      error: string;
    };

function setCorsHeaders(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET");
}

const normalizeZip = (value: unknown) => String(value || "").replace(/\D/g, "").slice(0, 5);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NetworkByZipResponse>
) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const zipCode = normalizeZip(req.query.zip || req.query.zipCode);

    if (zipCode.length !== 5) {
      return res.status(400).json({ error: "A 5-digit zip code is required" });
    }

    const network = await prisma.network_codes.findUnique({
      where: { zip_code: zipCode },
      select: {
        zip_code: true,
        parish: true,
        network_name: true,
        network_code: true,
        state: true,
      },
    });

    if (!network) {
      return res.status(404).json({ error: "No network found for this zip code" });
    }

    return res.status(200).json({
      zipCode: network.zip_code,
      parish: network.parish,
      networkName: network.network_name,
      networkCode: network.network_code,
      state: network.state,
    });
  } catch (error) {
    console.error("network-by-zip error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to look up network",
    });
  }
}
