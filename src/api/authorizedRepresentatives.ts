import { buildDashboardQuery } from "@/utils/dashboardContext";

export type AuthorizedRepresentative = {
  assignmentId: string;
  memberId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  memberSince: string;
};

export type NetworkMember = {
  id: string;
  displayId: string | null;
  name: string;
  email: string;
  phone: string;
  memberSince: string;
  authorizedRepresentativePartners: string[];
};

export type RepresentativeAssignment = {
  assignmentId: string;
  representedUserId: string;
  representedUserType: "partner" | "provider" | "admin";
  representedName: string;
  representedNetworkName: string | null;
  representedNetworkCode: string | null;
  status: "pending" | "accepted" | "declined";
  invitedAt: string | null;
};

async function readJsonOrThrow(response: Response, fallbackMessage: string) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || fallbackMessage);
  }

  return data;
}

export async function fetchAuthorizedRepresentatives(cognitoId?: string) {
  const query = buildDashboardQuery(cognitoId);
  const response = await fetch(`/api/authorized-representatives${query}`, {
    credentials: "include",
  });

  return (await readJsonOrThrow(response, "Failed to fetch authorized representatives")) as {
    organization: {
      id: string;
      type: "provider" | "partner" | "admin";
      networkCode: string | null;
      networkName: string | null;
    };
    representatives: AuthorizedRepresentative[];
    networkMembers: NetworkMember[];
  };
}

export async function addAuthorizedRepresentative(memberId: string, cognitoId?: string) {
  const query = buildDashboardQuery(cognitoId);
  const response = await fetch(`/api/authorized-representatives${query}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ memberId }),
  });

  return (await readJsonOrThrow(response, "Failed to add authorized representative")) as {
    assignment: AuthorizedRepresentative;
  };
}

export async function removeAuthorizedRepresentative(assignmentId: string, cognitoId?: string) {
  const query = buildDashboardQuery(cognitoId);
  const response = await fetch(`/api/authorized-representatives${query}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ assignmentId }),
  });

  return (await readJsonOrThrow(response, "Failed to remove authorized representative")) as {
    assignment: AuthorizedRepresentative;
  };
}

export async function fetchRepresentativeAssignments() {
  const response = await fetch("/api/rep-assignments", {
    credentials: "include",
  });

  return (await readJsonOrThrow(response, "Failed to load representative assignments")) as {
    member: {
      id: string;
      displayId: string | null;
      name: string;
      email: string;
    };
    assignments: RepresentativeAssignment[];
  };
}

export async function respondToRepresentativeInvite(assignmentId: string, action: "accept" | "decline") {
  const response = await fetch("/api/rep-assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ assignmentId, action }),
  });

  return (await readJsonOrThrow(response, "Failed to respond to representative invite")) as { ok: true };
}
