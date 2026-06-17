import type { MemberVoucherRecord } from "@/utils/memberVoucherFormatting";

type MemberNetworkResponse = {
  member: {
    id: string;
    displayId: string | null;
    networkName: string | null;
    networkCode: string | null;
  };
  vouchers: MemberVoucherRecord[];
};

async function readJsonOrThrow(response: Response, fallbackMessage: string) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || fallbackMessage);
  }

  return data;
}

export async function fetchMemberNetworkVouchers() {
  const response = await fetch("/api/member-network-vouchers", {
    credentials: "include",
  });
  return (await readJsonOrThrow(response, "Failed to fetch member network vouchers")) as MemberNetworkResponse;
}

export async function fetchMemberVouchers() {
  const response = await fetch("/api/member-vouchers", {
    credentials: "include",
  });
  return (await readJsonOrThrow(response, "Failed to fetch member vouchers")) as MemberNetworkResponse;
}

export async function claimMemberVoucher(voucherId: string) {
  const response = await fetch("/api/claim-member-voucher", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ voucherId }),
  });

  return (await readJsonOrThrow(response, "Failed to claim voucher")) as {
    success: boolean;
    alreadyClaimed?: boolean;
    voucherId: string;
  };
}
