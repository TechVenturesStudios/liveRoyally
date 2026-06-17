import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { resolveDashboardAccount } from "../../lib/dashboard-account";

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
  const queryCognitoId = String(req.query.cognitoId || req.query.cognito_id || "").trim();

  if (queryCognitoId) {
    return queryCognitoId;
  }

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
    const account = await resolveDashboardAccount(req, ["partner"]);
    if (!account) {
      return res.status(500).json({ error: "Failed to resolve account" });
    }
    if ("error" in account) {
      return res.status(account.status).json({ error: account.error });
    }

    const partnerProfile = await prisma.partner_profiles.findUnique({
      where: { user_id: account.actingUserId },
      select: {
        partner_code: true,
        network_name: true,
        network_code: true,
      },
    });

    const providers = await prisma.provider_profiles.findMany({
      where: {
        partner_id: account.actingUserId,
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
        business_city: true,
        business_state: true,
        business_zip: true,
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
        id: account.actingUserId,
        partnerCode: partnerProfile?.partner_code ?? null,
        networkName: partnerProfile?.network_name ?? null,
        networkCode: partnerProfile?.network_code ?? null,
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
        businessCity: provider.business_city,
        businessState: provider.business_state,
        businessZip: provider.business_zip,
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
