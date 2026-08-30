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
};

export type AdminHistoricalProvider = {
  id: string;
  businessName: string;
  businessCategory: string;
  agentName: string;
  participated: boolean;
  events: AdminHistoricalEvent[];
};

export type AdminHistoricalPartner = { name: string; providers: AdminHistoricalProvider[] };
export type AdminHistoricalNetwork = { name: string; code: string; partners: AdminHistoricalPartner[] };

export async function fetchAdminHistoricalEvents(cognitoId?: string) {
  const query = cognitoId ? `?cognitoId=${encodeURIComponent(cognitoId)}` : "";
  const response = await fetch(`/api/admin/historical-events${query}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to load historical events");
  return data as { networks: AdminHistoricalNetwork[] };
}
