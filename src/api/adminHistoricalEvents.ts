export type AdminHistoricalEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  membersAttended: number;
  membersInvited: number;
  revenue: number;
  acceptedProviderCount: number;
};

export type AdminHistoricalPartner = { name: string; events: AdminHistoricalEvent[] };
export type AdminHistoricalNetwork = { name: string; code: string; partners: AdminHistoricalPartner[] };

export async function fetchAdminHistoricalEvents(cognitoId?: string) {
  const query = cognitoId ? `?cognitoId=${encodeURIComponent(cognitoId)}` : "";
  const response = await fetch(`/api/admin/historical-events${query}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to load historical events");
  return data as { networks: AdminHistoricalNetwork[] };
}
