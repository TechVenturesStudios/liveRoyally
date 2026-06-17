export type MemberPurchaseRecord = {
  id: string;
  voucherId: string;
  title: string;
  provider: string;
  originalPrice: number;
  discount: number;
  finalPrice: number;
  date: string;
  status: "completed" | "refunded";
};
