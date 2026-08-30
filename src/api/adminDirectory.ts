import { buildDashboardQuery } from "@/utils/dashboardContext";

export type AdminPartner = {
  id: string;
  organizationName: string;
  organizationCategory: string;
  agentFirstName: string;
  agentLastName: string;
  organizationEmail: string;
  organizationPhone: string;
  organizationCity: string;
  organizationState: string;
  plan: string;
  joinDate: string;
  publishedEvents: number;
  pendingEvents: number;
  totalProviders: number;
};

export type AdminProvider = {
  id: string;
  businessName: string;
  businessCategory: string;
  agentFirstName: string;
  agentLastName: string;
  agentPhone: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZip: string;
  partnerName: string;
  networkCode: string;
};

export async function fetchAdminDirectory(cognitoId?: string): Promise<{
  partners: AdminPartner[];
  providers: AdminProvider[];
}> {
  const response = await fetch(`/api/admin/directory${buildDashboardQuery(cognitoId)}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load admin directory");
  }

  return {
    partners: Array.isArray(data.partners) ? data.partners : [],
    providers: Array.isArray(data.providers) ? data.providers : [],
  };
}
