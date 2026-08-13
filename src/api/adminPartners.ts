import { buildDashboardQuery } from "@/utils/dashboardContext";

export type AdminPendingPartner = {
  subscriptionId: string;
  partnerId: string;
  partnerCode: string | null;
  organizationName: string;
  organizationCategory: string | null;
  agentFirstName: string | null;
  agentLastName: string | null;
  organizationEmail: string;
  organizationPhone: string | null;
  organizationAddress: string | null;
  organizationCity: string | null;
  organizationState: string | null;
  organizationZip: string | null;
  networkName: string | null;
  networkCode: string | null;
  plan: "spotlight" | "standard" | "premium";
  planLabel: string;
  monthlyPriceCents: number;
  currency: string;
  submittedAt: string | null;
};

export async function fetchPendingPartnerApplications(cognitoId?: string) {
  const response = await fetch(`/api/admin/pending-partners${buildDashboardQuery(cognitoId)}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load pending partner applications");
  }

  return {
    pendingCount: typeof data.pendingCount === "number" ? data.pendingCount : 0,
    pendingPartners: Array.isArray(data.pendingPartners)
      ? (data.pendingPartners as AdminPendingPartner[])
      : [],
  };
}

export async function updatePendingPartnerApplication(input: {
  subscriptionId: string;
  action: "approve" | "decline";
}) {
  const response = await fetch(`/api/admin/pending-partners/${encodeURIComponent(input.subscriptionId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: input.action }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to update partner application");
  }

  return data as {
    subscriptionId: string;
    status: string;
    approvedAt: string | null;
    canceledAt: string | null;
    squareSubscriptionId: string | null;
    alreadyHandled?: boolean;
  };
}
