import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { queueProfileUpdatedEmail } from "../../lib/notification-templates";

const optional = (value: unknown) => {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  return String(value).trim();
};

const changed = (before: unknown, after: unknown) => String(before ?? "") !== String(after ?? "");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    return res.status(200).end();
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const cognitoId = String(req.body?.cognitoId || req.body?.cognitoSub || "").trim();
    if (!cognitoId) return res.status(400).json({ error: "cognitoId is required" });

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.users.findUnique({
        where: { cognito_id: cognitoId },
        include: { member_profiles: true, provider_profiles: true, partner_profiles: true },
      });
      if (!user) throw new Error("User not found");

      const changes: string[] = [];
      const userData = {
        first_name: optional(req.body.firstName),
        last_name: optional(req.body.lastName),
        phone_number: optional(req.body.phoneNumber || req.body.agentPhone || req.body.businessPhone),
      };
      if (changed(user.first_name, userData.first_name)) changes.push("First name");
      if (changed(user.last_name, userData.last_name)) changes.push("Last name");
      if (changed(user.phone_number, userData.phone_number)) changes.push("Phone number");
      await tx.users.update({ where: { user_id: user.user_id }, data: userData });

      if (user.user_type === "member" && user.member_profiles) {
        const data = {
          network_name: optional(req.body.networkName), network_code: optional(req.body.networkCode),
          zip_code: optional(req.body.zipCode), ethnicity: optional(req.body.ethnicity),
          age_group: optional(req.body.ageGroup), gender: optional(req.body.gender),
          birthday: req.body.birthday ? new Date(`${req.body.birthday}T00:00:00.000Z`) : null,
          notification_enabled: Boolean(req.body.notificationEnabled),
        };
        const labels: Record<string, string> = { network_name: "Network", network_code: "Network code", zip_code: "ZIP code", ethnicity: "Ethnicity", age_group: "Age group", gender: "Gender", birthday: "Birthday", notification_enabled: "Email notification preference" };
        for (const [key, label] of Object.entries(labels)) if (changed((user.member_profiles as any)[key], (data as any)[key])) changes.push(label);
        await tx.member_profiles.update({ where: { user_id: user.user_id }, data });
      }

      if (user.user_type === "provider" && user.provider_profiles) {
        const data = {
          agent_first_name: optional(req.body.agentFirstName), agent_last_name: optional(req.body.agentLastName), agent_phone: optional(req.body.agentPhone),
          business_name: optional(req.body.businessName), business_category: optional(req.body.businessCategory), business_address: optional(req.body.businessAddress),
          business_city: optional(req.body.businessCity), business_state: optional(req.body.businessState), business_zip: optional(req.body.businessZip), business_email: optional(req.body.businessEmail), business_phone: optional(req.body.businessPhone),
          notification_enabled: Boolean(req.body.notificationEnabled),
        };
        const labels: Record<string, string> = { agent_first_name: "Agent first name", agent_last_name: "Agent last name", agent_phone: "Agent phone", business_name: "Business name", business_category: "Business category", business_address: "Business address", business_city: "Business city", business_state: "Business state", business_zip: "Business ZIP code", business_email: "Business email", business_phone: "Business phone", notification_enabled: "Email notification preference" };
        for (const [key, label] of Object.entries(labels)) if (changed((user.provider_profiles as any)[key], (data as any)[key])) changes.push(label);
        await tx.provider_profiles.update({ where: { user_id: user.user_id }, data });
      }

      if (user.user_type === "partner" && user.partner_profiles) {
        const data = {
          agent_first_name: optional(req.body.agentFirstName), agent_last_name: optional(req.body.agentLastName), agent_phone: optional(req.body.agentPhone),
          org_name: optional(req.body.organizationName), org_category: optional(req.body.organizationCategory), org_address: optional(req.body.organizationAddress),
          org_city: optional(req.body.organizationCity), org_state: optional(req.body.organizationState), org_zip: optional(req.body.organizationZip), org_email: optional(req.body.organizationEmail), org_phone: optional(req.body.organizationPhone),
          notification_enabled: Boolean(req.body.notificationEnabled),
        };
        const labels: Record<string, string> = { agent_first_name: "Agent first name", agent_last_name: "Agent last name", agent_phone: "Agent phone", org_name: "Organization name", org_category: "Organization category", org_address: "Organization address", org_city: "Organization city", org_state: "Organization state", org_zip: "Organization ZIP code", org_email: "Organization email", org_phone: "Organization phone", notification_enabled: "Email notification preference" };
        for (const [key, label] of Object.entries(labels)) if (changed((user.partner_profiles as any)[key], (data as any)[key])) changes.push(label);
        await tx.partner_profiles.update({ where: { user_id: user.user_id }, data });
      }

      return { user, changes: [...new Set(changes)] };
    });

    if (result.changes.length) {
      await queueProfileUpdatedEmail({ userId: result.user.user_id, firstName: result.user.first_name, email: result.user.email, changedFieldDescription: result.changes.join(", ") });
    }
    return res.status(200).json({ updated: true, changedFields: result.changes });
  } catch (error) {
    console.error("profile update error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to update profile" });
  }
}
