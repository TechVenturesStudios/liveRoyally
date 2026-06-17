import type { MemberPurchaseRecord } from "@/utils/memberPurchaseHistory";

type MemberPurchaseHistoryResponse = {
  member: {
    id: string;
    displayId: string | null;
  };
  purchases: MemberPurchaseRecord[];
};

async function readJsonOrThrow(response: Response, fallbackMessage: string) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || fallbackMessage);
  }

  return data;
}

export async function fetchMemberPurchaseHistory() {
  const response = await fetch("/api/member-purchase-history", {
    credentials: "include",
  });

  return (await readJsonOrThrow(response, "Failed to fetch member purchase history")) as MemberPurchaseHistoryResponse;
}
