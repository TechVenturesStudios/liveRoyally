export type AdminMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  network: string;
  networkCode: string;
  zipCode: string;
  joinDate: string;
  status: "active" | "inactive";
  engagementScore: number;
};

export async function fetchAdminMembers(cognitoId?: string) {
  const query = cognitoId ? `?cognitoId=${encodeURIComponent(cognitoId)}` : "";
  const response = await fetch(`/api/admin/members${query}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to load members");
  return data as { members: AdminMember[] };
}
