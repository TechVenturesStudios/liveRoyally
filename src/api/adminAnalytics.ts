export type AdminAnalyticsPartner = {
  id: string;
  organizationName: string;
  organizationCategory: string;
  plan: string;
  joinDate: string;
  publishedEvents: number;
  pendingEvents: number;
  totalProviders: number;
  city: string;
  state: string;
};

export type AdminAnalyticsNetwork = {
  network: string;
  code: string;
  activeMembers: number;
  totalMembers: number;
  topPartner: string;
  totalProviders: number;
  totalEvents: number;
  launchDate: string;
};

export type AdminAnalyticsResponse = {
  totals: {
    partners: number;
    providers: number;
    members: number;
    pendingPartners: number;
  };
  partners: AdminAnalyticsPartner[];
  networks: AdminAnalyticsNetwork[];
};

export async function fetchAdminAnalytics(cognitoId?: string) {
  const query = cognitoId ? `?cognitoId=${encodeURIComponent(cognitoId)}` : "";
  const response = await fetch(`/api/admin/analytics${query}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load admin analytics");
  }

  return data as AdminAnalyticsResponse;
}
