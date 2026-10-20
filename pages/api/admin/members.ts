import type { NextApiRequest, NextApiResponse } from "next";
import { UserType } from "@prisma/client";

import { resolveDashboardAccount } from "../../../lib/dashboard-account";
import { isMemberActive } from "../../../lib/member-status";
import { prisma } from "../../../lib/prisma";

type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  network: string;
  networkCode: string;
  zipCode: string;
  joinDate: string;
  status: "active" | "inactive";
  engagementScore: number;
};

type MembersResponse = { members: Member[] } | { error: string };

const text = (value: string | null | undefined, fallback = "") => value?.trim() || fallback;

export default async function handler(req: NextApiRequest, res: NextApiResponse<MembersResponse>) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const account = await resolveDashboardAccount(req, ["admin"]);
    if (!account) return res.status(500).json({ error: "Unable to resolve admin account" });
    if ("error" in account) return res.status(account.status).json({ error: account.error });

    const members = await prisma.users.findMany({
      where: { user_type: UserType.member },
      orderBy: [{ created_at: "asc" }, { last_name: "asc" }, { first_name: "asc" }],
      select: {
        user_id: true, display_id: true, first_name: true, last_name: true, email: true, created_at: true,
        member_profiles: { select: { network_name: true, network_code: true, zip_code: true } },
        member_vouchers: { select: { voucher_id: true }, take: 1 },
        reward_accounts: {
          where: { reward_year: new Date().getFullYear() },
          select: { points_balance: true, points_earned: true },
        },
      },
    });

    return res.status(200).json({ members: members.map((member) => {
      const profile = member.member_profiles;
      return {
        id: text(member.display_id, member.user_id),
        firstName: text(member.first_name, "Unknown"),
        lastName: text(member.last_name),
        email: member.email,
        network: text(profile?.network_name, "Unassigned Network"),
        networkCode: text(profile?.network_code, "unassigned"),
        zipCode: text(profile?.zip_code, "—"),
        joinDate: (member.created_at ?? new Date()).toISOString(),
        status: isMemberActive(member.created_at, member.member_vouchers.length > 0) ? "active" : "inactive",
        engagementScore: member.reward_accounts.reduce((total, account) => total + account.points_balance, 0),
      };
    }) });
  } catch (error) {
    console.error("admin members error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to load members" });
  }
}
