export interface PartnerProvider {
  id: string;
  displayId?: string | null;
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
  createdAt?: string | null;
  partnerId?: string | null;
}

type MyProvidersApiProvider = {
  id: string;
  displayId?: string | null;
  businessName: string | null;
  businessCategory: string | null;
  agentFirstName: string | null;
  agentLastName: string | null;
  agentPhone: string | null;
  businessEmail: string | null;
  businessPhone: string | null;
  businessAddress: string | null;
  businessCity: string | null;
  businessState: string | null;
  businessZip: string | null;
  createdAt?: string | null;
  partnerId?: string | null;
};


export const mapPartnerProvider = (provider: MyProvidersApiProvider): PartnerProvider => {

  return {
    id: provider.id,
    displayId: provider.displayId ?? null,
    businessName: provider.businessName || "Unnamed Provider",
    businessCategory: provider.businessCategory || "Other",
    agentFirstName: provider.agentFirstName || "",
    agentLastName: provider.agentLastName || "",
    agentPhone: provider.agentPhone || "",
    businessEmail: provider.businessEmail || "",
    businessPhone: provider.businessPhone || "",
    businessAddress: provider.businessAddress || "",
    businessCity: provider.businessCity || "",
    businessState: provider.businessState || "",
    businessZip: provider.businessZip || "",
    createdAt: provider.createdAt ?? null,
    partnerId: provider.partnerId ?? null,
  };
};

export const fetchPartnerProviders = async (cognitoId?: string): Promise<PartnerProvider[]> => {
  const query = buildDashboardQuery(cognitoId);
  const response = await fetch(`/api/my-providers${query}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load providers");
  }

  return Array.isArray(data.providers) ? data.providers.map(mapPartnerProvider) : [];
};
import { buildDashboardQuery } from "@/utils/dashboardContext";
