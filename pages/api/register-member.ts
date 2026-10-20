import type { NextApiRequest, NextApiResponse } from "next";
import { randomInt } from "crypto";
import { UserType } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { awardAccountCreationReward, awardRewardTask } from "../../lib/rewards";
import { getOrCreateRole } from "../../lib/roles";
import { queueMemberPointsTierGuideEmail, queueWelcomeEmail } from "../../lib/notification-templates";
import { getAppBaseUrl } from "../../lib/app-url";

type RegisterMemberResponse =
  | {
      message: string;
      userId: string;
      displayId: string;
    }
  | {
      error: string;
    };

const normalizeZip = (value: unknown) => String(value || "").replace(/\D/g, "").slice(0, 5);

function parseEligibleBirthday(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const birthday = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(birthday.getTime()) || birthday.toISOString().slice(0, 10) !== value) return null;
  const today = new Date();
  const cutoff = new Date(Date.UTC(today.getUTCFullYear() - 16, today.getUTCMonth(), today.getUTCDate()));
  return birthday <= cutoff ? birthday : null;
}

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

    if (!String(body.phoneNumber || "").trim()) {
      return res.status(400).json({ error: "phoneNumber is required" });
    }

    const displayId = `M-${randomInt(100000000, 999999999)}`;
    const zipCode = normalizeZip(body.zipCode);
    const birthday = parseEligibleBirthday(body.birthday);

    if (!birthday) {
      return res.status(400).json({ error: "You must be at least 16 years old to create an account" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const normalizedEmail = String(body.email || "").toLowerCase().trim();
      const existingUser = await tx.users.findFirst({
        where: { OR: [{ email: normalizedEmail }, { cognito_id: String(body.cognitoSub) }] },
        select: { user_id: true },
      });

      if (existingUser) {
        const error = new Error("An account already exists with that email") as Error & { statusCode?: number };
        error.statusCode = 409;
        throw error;
      }

      const network =
        zipCode.length === 5
          ? await tx.network_codes.findUnique({
              where: { zip_code: zipCode },
              select: { network_name: true, network_code: true },
            })
          : null;

      const user = await tx.users.create({
        data: {
          cognito_id: String(body.cognitoSub),
          email: normalizedEmail,
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
          network_name: network?.network_name ?? body.networkName ?? null,
          network_code: network?.network_code ?? body.networkCode ?? null,
          zip_code: zipCode || null,
          ethnicity: body.ethnicity || null,
          age_group: body.ageGroup || null,
          gender: body.gender || null,
          birthday,
          notification_enabled: Boolean(body.notificationEnabled),
          terms_accepted: Boolean(body.termsAccepted),
        },
      });

      const referralToken = String(body.referralToken || "").trim();
      if (referralToken) {
        const referral = await tx.referrals.findUnique({ where: { referral_token: referralToken }, select: { referral_id: true, referrer_id: true, status: true } });
        if (referral && referral.status === "pending" && referral.referrer_id !== user.user_id) {
          const updatedReferral = await tx.referrals.update({
            where: { referral_id: referral.referral_id },
            data: { referred_user_id: user.user_id, status: "registered", registered_at: new Date() },
            select: { referral_id: true, referrer_id: true },
          });
          const reward = await awardRewardTask(tx, {
            userId: updatedReferral.referrer_id,
            taskKey: "member_refer_new_customer",
            description: "Verified member referral",
          });
          if (reward.awarded) {
            await tx.referrals.update({ where: { referral_id: updatedReferral.referral_id }, data: { status: "rewarded", rewarded_at: new Date() } });
          }
        }
      }

      await awardAccountCreationReward(tx, { userId: user.user_id, userType: UserType.member });

      return user;
    });

    await Promise.all([
      queueWelcomeEmail(result.user_id, "member"),
      queueMemberPointsTierGuideEmail({
        userId: result.user_id,
        dashboardLink: `${getAppBaseUrl(req)}/dashboard`,
        idempotencyKey: `points-tier-guide:registration:${result.user_id}`,
      }),
    ]);

    return res.status(200).json({
      message: "DB user created",
      userId: result.user_id,
      displayId,
    });
  } catch (error) {
    const statusCode = error instanceof Error
      ? (error as Error & { statusCode?: number }).statusCode
      : undefined;
    console.error(error);
    return res.status(statusCode ?? 500).json({
      error: error instanceof Error ? error.message : "Failed to register member in DB",
    });
  }
}
