import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";

type ProviderEntry = {
  id: string;
  displayId: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  networkName: string | null;
  networkCode: string | null;
  businessName: string | null;
  businessCategory: string | null;
  businessAddress: string | null;
  businessEmail: string | null;
  businessPhone: string | null;
  agentFirstName: string | null;
  agentLastName: string | null;
  agentPhone: string | null;
  createdAt: Date | null;
  partnerId: string | null;
};

type MyProvidersResponse =
  | {
      partner: {
        id: string;
        partnerCode: string | null;
        networkName: string | null;
        networkCode: string | null;
      };
      providers: ProviderEntry[];
    }
  | {
      error: string;
    };

function setCorsHeaders(res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET");
}

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce<Record<string, string>>((cookies, cookie) => {
    const [rawName, ...rawValue] = cookie.trim().split("=");

    if (!rawName) {
      return cookies;
    }

    cookies[rawName] = decodeURIComponent(rawValue.join("="));
    return cookies;
  }, {});
}

function getCognitoIdFromRequest(req: NextApiRequest) {
  const cookies = parseCookies(req.headers.cookie);
  const idToken = cookies.lr_id_token;

  if (!idToken) {
    return null;
  }

  const payload = JSON.parse(
    Buffer.from(idToken.split(".")[1], "base64url").toString("utf8")
  ) as { sub?: string };

  return payload.sub ?? null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MyProvidersResponse>
) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const cognitoId = getCognitoIdFromRequest(req);

    if (!cognitoId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const partner = await prisma.users.findUnique({
      where: { cognito_id: cognitoId },
      select: {
        user_id: true,
        user_type: true,
        partner_profiles: {
          select: {
            partner_code: true,
            network_name: true,
            network_code: true,
          },
        },
      },
    });

    if (!partner || partner.user_type !== "partner" || !partner.partner_profiles) {
      return res.status(403).json({ error: "Current user is not a partner" });
    }

    const partnerProfile = partner.partner_profiles;

    const providers = await prisma.provider_profiles.findMany({
      where: {
        partner_id: partner.user_id,
        users: {
          user_type: "provider",
        },
      },
      orderBy: [{ business_name: "asc" }, { created_at: "desc" }],
      select: {
        partner_id: true,
        network_name: true,
        network_code: true,
        business_name: true,
        business_category: true,
        business_address: true,
        business_email: true,
        business_phone: true,
        agent_first_name: true,
        agent_last_name: true,
        agent_phone: true,
        created_at: true,
        users: {
          select: {
            user_id: true,
            display_id: true,
            email: true,
            first_name: true,
            last_name: true,
            phone_number: true,
          },
        },
      },
    });

    return res.status(200).json({
      partner: {
        id: partner.user_id,
        partnerCode: partnerProfile.partner_code,
        networkName: partnerProfile.network_name,
        networkCode: partnerProfile.network_code,
      },
      providers: providers.map((provider) => ({
        id: provider.users.user_id,
        displayId: provider.users.display_id,
        email: provider.users.email,
        firstName: provider.users.first_name,
        lastName: provider.users.last_name,
        phoneNumber: provider.users.phone_number,
        networkName: provider.network_name,
        networkCode: provider.network_code,
        businessName: provider.business_name,
        businessCategory: provider.business_category,
        businessAddress: provider.business_address,
        businessEmail: provider.business_email,
        businessPhone: provider.business_phone,
        agentFirstName: provider.agent_first_name,
        agentLastName: provider.agent_last_name,
        agentPhone: provider.agent_phone,
        createdAt: provider.created_at,
        partnerId: provider.partner_id,
      })),
    });
  } catch (error) {
    console.error("my-providers error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch providers",
    });
  }
}
