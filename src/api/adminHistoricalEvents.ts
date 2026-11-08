import type { EventLifecycleStatus } from "@/utils/eventStatus";

export type AdminEventStatusGroup = "pending" | "active" | "historical";

export type AdminHistoricalEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  status: EventLifecycleStatus;
  statusGroup: AdminEventStatusGroup;
  membersAttended: number;
  membersInvited: number;
  revenue: number;
  acceptedProviderCount: number;
};

export type AdminHistoricalPartner = { id: string; name: string; networkName: string; events: AdminHistoricalEvent[] };

export async function fetchAdminHistoricalEvents(cognitoId?: string) {
  const query = cognitoId ? `?cognitoId=${encodeURIComponent(cognitoId)}` : "";
  const response = await fetch(`/api/admin/historical-events${query}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to load events");
  return data as { partners: AdminHistoricalPartner[] };
}
