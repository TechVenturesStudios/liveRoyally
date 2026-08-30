import { buildDashboardQuery } from "@/utils/dashboardContext";

export type AdminOverviewNetwork = {
  name: string;
  code: string;
  combinedPoints: number;
};

export type AdminOverviewResponse = {
  completedEventCount: number;
  networksWithActivePartners: number;
  topNetworks: AdminOverviewNetwork[];
};

export async function fetchAdminOverview(cognitoId?: string): Promise<AdminOverviewResponse> {
  const response = await fetch(`/api/admin/overview${buildDashboardQuery(cognitoId)}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load admin overview");
  }

  return {
    completedEventCount: typeof data.completedEventCount === "number" ? data.completedEventCount : 0,
    networksWithActivePartners: typeof data.networksWithActivePartners === "number" ? data.networksWithActivePartners : 0,
    topNetworks: Array.isArray(data.topNetworks)
      ? data.topNetworks.map((network: AdminOverviewNetwork) => ({
          name: network.name,
          code: network.code,
          combinedPoints: network.combinedPoints,
        }))
      : [],
  };
}
