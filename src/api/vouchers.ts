type CreateVoucherInput = {
  eventId: string;
  providerId: string;
  type: "N" | "P" | "A" | "F";
  value?: string | number;
  promoItem?: string;
  memberPrice?: string | number;
  maxRedemptions?: string | number;
  expirationDate?: string;
};

export async function createVoucher(input: CreateVoucherInput) {
  const response = await fetch("/api/create-voucher", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create voucher");
  }

  return data as {
    voucher: {
      voucher_id: string;
      event_id: string | null;
      provider_id: string | null;
      type: string | null;
      value: string | number | null;
      expiration_date: string | null;
      status: string | null;
      promo_item: string | null;
      member_price: number | null;
      max_redemptions: number | null;
      created_at: string | null;
    };
    alreadySignedUp: boolean;
  };
}
