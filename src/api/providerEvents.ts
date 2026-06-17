export type ProviderPendingInvite = {
  inviteId: string;
  eventId: string;
  providerId: string;
  partnerId: string;
  eventTitle: string;
  eventDescription: string;
  eventDate: string;
  eventTime: string;
  location: string;
  networkPoints: number;
  deadline: string;
  partnerName: string;
  status: "pending" | "accepted" | "declined" | "expired";
};

export type ProviderInviteResponseInput = {
  inviteId: string;
  action: "approve" | "decline";
  voucher?: {
    type: "N" | "P" | "A" | "F";
    value?: string | number;
    promoItem?: string;
    memberPrice?: string | number;
    maxRedemptions?: string | number;
  };
};

export async function fetchProviderPendingEvents(cognitoId?: string) {
  const response = await fetch(`/api/provider-pending-events${buildDashboardQuery(cognitoId)}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load provider pending events");
  }

  return Array.isArray(data.events) ? (data.events as ProviderPendingInvite[]) : [];
}

export async function respondToProviderInvite(input: ProviderInviteResponseInput) {
  const response = await fetch("/api/provider-event-invite-response", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to update invite");
  }

  return data as {
    invite: {
      invite_id: string;
      status: string;
      responded_at: string | null;
      voucher_id: string | null;
    };
    voucher?: {
      voucher_id: string;
    };
    alreadyApproved?: boolean;
  };
}
import { buildDashboardQuery } from "@/utils/dashboardContext";
