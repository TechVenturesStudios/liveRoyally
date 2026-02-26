// src/utils/voucherStorage.ts
export type SelectedVoucher = {
  id: string; // voucher_id
  eventId: string;
  type: "A" | "B" | "C";
  provider: string;
  title: string;
  description: string;
  expiry: string | null;
  networkId: string;
};

const KEY = "selectedVouchers";

export const getSelectedVouchers = (): SelectedVoucher[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveSelectedVouchers = (items: SelectedVoucher[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
};

export const isVoucherSelected = (voucherId: string) => {
  return getSelectedVouchers().some((v) => v.id === voucherId);
};

export const addSelectedVoucher = (voucher: SelectedVoucher) => {
  const existing = getSelectedVouchers();
  if (existing.some((v) => v.id === voucher.id)) return;
  saveSelectedVouchers([voucher, ...existing]);
};

export const removeSelectedVoucher = (voucherId: string) => {
  const existing = getSelectedVouchers();
  saveSelectedVouchers(existing.filter((v) => v.id !== voucherId));
};

export const clearSelectedVouchers = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
};
