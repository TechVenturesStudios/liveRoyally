import type { NextApiRequest, NextApiResponse } from "next";
import { randomInt } from "crypto";
import { UserType } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { getOrCreateRole } from "../../lib/roles";

type RegisterMemberResponse =
  | {
      message: string;
      userId: string;
      displayId: string;
    }
  | {
      error: string;
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterMemberResponse>
) {
  console.log(req.body)
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

    if (!body.cognitoSub) {
      return res.status(400).json({ error: "cognitoSub is required" });
    }

    const displayId = `M-${randomInt(100000000, 999999999)}`;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          cognito_id: String(body.cognitoSub),
          email: String(body.email || "").toLowerCase().trim(),
          first_name: body.firstName || null,
          last_name: body.lastName || null,
          phone_number: body.phoneNumber || null,
          user_type: UserType.member,
          display_id: displayId,
        },
        select: { user_id: true },
      });

      const role = await getOrCreateRole(tx, "member");

      await tx.user_roles.create({
        data: {
          user_id: user.user_id,
          role_id: role.role_id,
        },
      });

      await tx.member_profiles.create({
        data: {
          user_id: user.user_id,
          network_name: body.networkName || null,
          network_code: body.networkCode || null,
          zip_code: body.zipCode || null,
          ethnicity: body.ethnicity || null,
          age_group: body.ageGroup || null,
          gender: body.gender || null,
          notification_enabled: Boolean(body.notificationEnabled),
          terms_accepted: Boolean(body.termsAccepted),
        },
      });

      return user;
    });

    return res.status(200).json({
      message: "DB user created",
      userId: result.user_id,
      displayId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to register member in DB",
    });
  }
}
