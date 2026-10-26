import { buildDashboardQuery } from "@/utils/dashboardContext";

export type PartnerEventProviderStatus = "pending" | "accepted" | "declined" | "expired";

export type PartnerPendingEventProvider = {
  inviteId: string;
  providerId: string;
  providerName: string;
  providerCategory: string;
  status: PartnerEventProviderStatus;
  invitedAt: string | null;
  respondedAt: string | null;
};

export type PartnerPendingEvent = {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate: string;
  time: string;
  location: string;
  networkPoints: number;
  createdDate: string;
  responseDeadline: string;
  status: "pending" | "active" | "completed" | "cancelled" | "expired";
  providers: PartnerPendingEventProvider[];
};

export type PartnerDashboardEvent = {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate: string;
  time: string;
  location: string;
  networkPoints: number;
  memberPrice: number | null;
  totalVouchersAvailable: number | null;
  createdDate: string;
  responseDeadline: string;
  status: "pending" | "active" | "completed" | "cancelled" | "expired";
  published: boolean;
  stage: "needs_approval" | "upcoming" | "past";
  providerCount: number;
  purchaseCount: number;
  pendingProviderCount: number;
  acceptedProviderCount: number;
  declinedProviderCount: number;
  providers: PartnerPendingEventProvider[];
};

export type PartnerEventAnalytics = PartnerDashboardEvent & {
  providerId: string;
  providerName: string;
  membersAttended: number;
  membersInvited: number;
  revenue: number;
  targetRevenue: number;
  providerParticipated: boolean;
};

export async function fetchPartnerPendingEvents(cognitoId?: string) {
  const response = await fetch(`/api/partner-pending-events${buildDashboardQuery(cognitoId)}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load pending events");
  }

  return Array.isArray(data.events) ? (data.events as PartnerPendingEvent[]) : [];
}

export async function fetchPartnerDashboardEvents(cognitoId?: string) {
  const response = await fetch(`/api/partner-events${buildDashboardQuery(cognitoId)}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load partner events");
  }

  return Array.isArray(data.events) ? (data.events as PartnerDashboardEvent[]) : [];
}

export async function cancelPartnerEvent(eventId: string) {
  const response = await fetch("/api/cancel-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to cancel event");
  return data as { eventId: string; cancelled: boolean; published: boolean; notifications: { queued: number; failed: number } };
}

export async function addProviderToPartnerEvent(eventId: string, providerId: string) {
  const response = await fetch("/api/add-event-provider", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId, providerId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to add provider to event");
  return data as { inviteId: string; providerId: string; notificationQueued: boolean };
}

export async function fetchPartnerEventAnalytics(cognitoId?: string) {
  const response = await fetch(`/api/partner-event-analytics${buildDashboardQuery(cognitoId)}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load partner event analytics");
  }

  return Array.isArray(data.events) ? (data.events as PartnerEventAnalytics[]) : [];
}
