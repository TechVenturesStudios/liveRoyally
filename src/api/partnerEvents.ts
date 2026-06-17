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
  time: string;
  location: string;
  networkPoints: number;
  createdDate: string;
  responseDeadline: string;
  status: string;
  providers: PartnerPendingEventProvider[];
};

export type PartnerDashboardEvent = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  networkPoints: number;
  createdDate: string;
  responseDeadline: string;
  status: string;
  stage: "needs_approval" | "upcoming" | "past";
  providerCount: number;
  pendingProviderCount: number;
  acceptedProviderCount: number;
  declinedProviderCount: number;
  providers: PartnerPendingEventProvider[];
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
import { buildDashboardQuery } from "@/utils/dashboardContext";
