import { buildDashboardQuery } from "@/utils/dashboardContext";

export type AdminNetworkProvider = {
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
  partnerId: string | null;
  partnerName: string;
};

export type AdminNetworkPartner = {
  id: string;
  name: string;
  category: string;
  contactName: string;
  contactPhone: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  providerCount: number;
};

export type AdminNetworkResponse = {
  name: string;
  code: string;
  partners: AdminNetworkPartner[];
  providers: AdminNetworkProvider[];
};

export async function fetchAdminNetwork(networkCode: string, cognitoId?: string) {
  const response = await fetch(
    `/api/admin/network/${encodeURIComponent(networkCode)}${buildDashboardQuery(cognitoId)}`
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load network");
  }

  return data as AdminNetworkResponse;
}
