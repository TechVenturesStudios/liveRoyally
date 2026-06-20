export type MemberVoucherRecord = {
  voucher_id: string;
  event_id: string | null;
  provider_id: string | null;
  type: string | null;
  value: string | number | null;
  expiration_date: string | Date | null;
  status: string | null;
  created_at: string | Date | null;
  promo_item: string | null;
  member_price: string | number | null;
  max_redemptions: number | null;
  event_title: string | null;
  event_start_date?: string | Date | null;
  event_end_date?: string | Date | null;
  provider_name: string | null;
  provider_category: string | null;
  provider_address: string | null;
  provider_city: string | null;
  provider_state: string | null;
  provider_zip: string | null;
  provider_phone: string | null;
  provider_email: string | null;
  provider_network_name: string | null;
  provider_network_code: string | null;
  claimed_at?: string | Date | null;
};

const formatDollarValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return numericValue % 1 === 0 ? `$${numericValue.toFixed(0)}` : `$${numericValue.toFixed(2)}`;
};

export const formatVoucherMemberPrice = (value: string | number | null | undefined) => formatDollarValue(value);

const formatPercentValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return numericValue % 1 === 0 ? `${numericValue.toFixed(0)}%` : `${numericValue.toFixed(1)}%`;
};

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

export const getVoucherDiscountLabel = (voucher: MemberVoucherRecord) => {
  switch (String(voucher.type || "").trim().toUpperCase()) {
    case "A":
      return formatPercentValue(voucher.value) || "Discount";
    case "B":
      return formatDollarValue(voucher.value) || "Discount";
    case "C":
      return "Free";
    default:
      return voucher.member_price !== null && voucher.member_price !== undefined
        ? formatVoucherMemberPrice(voucher.member_price) || "Special"
        : "Special";
  }
};

export const getVoucherTitle = (voucher: MemberVoucherRecord) => {
  const providerName = voucher.provider_name || "Provider";
  const discountLabel = getVoucherDiscountLabel(voucher);
  const type = String(voucher.type || "").trim().toUpperCase();

  if (type === "C") {
    const promoItem = voucher.promo_item?.trim();
    return promoItem ? `Free ${promoItem} at ${providerName}` : `Free offer at ${providerName}`;
  }

  if (discountLabel !== "Special") {
    return `${discountLabel} Off at ${providerName}`;
  }

  return `${providerName} Voucher`;
};

export const getVoucherDescription = (voucher: MemberVoucherRecord) => {
  const providerName = voucher.provider_name || "this provider";
  const type = String(voucher.type || "").trim().toUpperCase();

  if (type === "A") {
    const percent = formatPercentValue(voucher.value);
    return percent
      ? `Get ${percent} off your purchase at ${providerName}.`
      : `Get a discount on your purchase at ${providerName}.`;
  }

  if (type === "B") {
    const amount = formatDollarValue(voucher.value);
    return amount
      ? `Save ${amount} on your purchase at ${providerName}.`
      : `Save on your purchase at ${providerName}.`;
  }

  if (type === "C") {
    const promoItem = voucher.promo_item?.trim();
    return promoItem
      ? `Redeem this voucher for a free ${promoItem} at ${providerName}.`
      : `Redeem this free-item voucher at ${providerName}.`;
  }

  if (voucher.member_price !== null && voucher.member_price !== undefined) {
    return `Member pricing starts at ${formatVoucherMemberPrice(voucher.member_price) || "a special rate"} at ${providerName}.`;
  }

  return `Exclusive offer available from ${providerName}.`;
};

export const getVoucherLocation = (voucher: MemberVoucherRecord) => {
  const parts = [voucher.provider_city, voucher.provider_state].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(", ");
  }

  if (voucher.provider_address) {
    return voucher.provider_address;
  }

  return "Location not provided";
};

export const getVoucherNetworkLabel = (voucher: MemberVoucherRecord) =>
  voucher.provider_network_name || voucher.provider_network_code || "Unknown network";

export const getVoucherExpiryDate = (voucher: MemberVoucherRecord) => formatDate(voucher.expiration_date);

export const getDaysUntilExpiry = (voucher: MemberVoucherRecord) => {
  const expiry = getVoucherExpiryDate(voucher);
  if (!expiry) return null;

  const diff = expiry.getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export const isVoucherExpired = (voucher: MemberVoucherRecord) => {
  const expiry = getVoucherExpiryDate(voucher);
  return expiry ? expiry.getTime() < new Date().setHours(0, 0, 0, 0) : false;
};

export const getVoucherStatusLabel = (status: string | null | undefined) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "active") return "Active";
  if (normalized === "claimed") return "Claimed";
  if (normalized === "expired") return "Expired";
  return status || "Unknown";
};

export const getVoucherDetailLocation = (voucher: MemberVoucherRecord) => {
  const location = getVoucherLocation(voucher);
  return location;
};
