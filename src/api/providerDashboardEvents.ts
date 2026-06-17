export type ProviderDashboardEventStatus = "pending" | "active" | "completed";

export type ProviderDashboardEvent = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  partner: string;
  status: ProviderDashboardEventStatus;
  participated: boolean;
  networkScore: number;
  approvedDate: string | null;
  goLiveDate: string | null;
  inviteStatus: string;
  voucherId: string | null;
  memberPrice: number | null;
  maxRedemptions: number | null;
  redemptions: number;
};

function isDashboardEventStatus(value: string): value is ProviderDashboardEventStatus {
  return value === "pending" || value === "active" || value === "completed";
}

export async function fetchProviderDashboardEvents(cognitoId?: string) {
  const response = await fetch(`/api/provider-events${buildDashboardQuery(cognitoId)}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load provider events");
  }

  return Array.isArray(data.events)
    ? (data.events as ProviderDashboardEvent[]).filter((event) => isDashboardEventStatus(event.status))
    : [];
}
import { buildDashboardQuery } from "@/utils/dashboardContext";
