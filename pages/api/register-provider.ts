import type { NextApiRequest, NextApiResponse } from "next";
import { randomInt } from "crypto";
import { UserType } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { getOrCreateRole } from "../../lib/roles";

type RegisterProviderResponse =
  | {
      message: string;
      userId: string;
      displayId: string;
      partnerId: string;
    }
  | {
      error: string;
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterProviderResponse>
) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body ?? {};
    const cognitoId = body.cognitoSub || body.cognitoId;
    const partnerCode = String(body.partnerCode || "").trim().toUpperCase();
    const partnerId = String(body.partnerId || "").trim();

    if (!cognitoId) {
      return res.status(400).json({ error: "cognitoSub is required" });
    }

    if (!partnerCode && !partnerId) {
      return res.status(400).json({ error: "partnerCode or partnerId is required" });
    }

    const displayId = `P-${randomInt(100000000, 999999999)}`;

    const result = await prisma.$transaction(async (tx) => {
      const partner = await tx.partner_profiles.findFirst({
        where: partnerCode
          ? { partner_code: partnerCode }
          : { user_id: partnerId },
        select: {
          user_id: true,
          network_name: true,
          network_code: true,
          org_name: true,
        },
      });

      if (!partner) {
        throw new Error("A valid partner code is required");
      }

      const user = await tx.users.create({
        data: {
          cognito_id: String(cognitoId),
          email: String(body.businessEmail || "").toLowerCase().trim(),
          first_name: body.agentFirstName || null,
          last_name: body.agentLastName || null,
          phone_number: body.agentPhone || null,
          user_type: UserType.provider,
          display_id: displayId,
        },
        select: { user_id: true },
      });

      const role = await getOrCreateRole(tx, "provider");

      await tx.user_roles.create({
        data: {
          user_id: user.user_id,
          role_id: role.role_id,
        },
      });

      await tx.provider_profiles.create({
        data: {
          user_id: user.user_id,
          partner_id: partner.user_id,
          network_name: partner.network_name || null,
          network_code: partner.network_code || null,
          business_name: body.businessName || null,
          business_category: body.businessCategory || null,
          business_address: body.businessAddress || null,
          business_state: body.businessState || null,
          business_city: body.businessCity || null,
          business_zip: body.businessZip || null,
          business_email: body.businessEmail || null,
          business_phone: body.businessPhone || null,
          agent_first_name: body.agentFirstName || null,
          agent_last_name: body.agentLastName || null,
          agent_phone: body.agentPhone || null,
          notification_enabled: Boolean(body.notificationEnabled),
          terms_accepted: Boolean(body.termsAccepted),
        },
      });

      return { user, partner };
    });

    return res.status(200).json({
      message: "Provider registered successfully",
      userId: result.user.user_id,
      displayId,
      partnerId: result.partner.user_id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to register provider",
    });
  }
}
