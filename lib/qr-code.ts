export interface MemberVoucherQrCodeData {
  voucherId: string;
  eventId: string;
  useCaseId: string;
  networkId: string;
  userId: string;
}

const isMemberVoucherQrCodeData = (value: unknown): value is MemberVoucherQrCodeData => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.voucherId === "string" &&
    typeof data.eventId === "string" &&
    typeof data.useCaseId === "string" &&
    typeof data.networkId === "string" &&
    typeof data.userId === "string" &&
    data.voucherId.trim() !== "" &&
    data.eventId.trim() !== "" &&
    data.useCaseId.trim() !== "" &&
    data.networkId.trim() !== "" &&
    data.userId.trim() !== ""
  );
};

export const buildMemberVoucherQrCodeData = (data: MemberVoucherQrCodeData) =>
  JSON.stringify(data);

export const parseMemberVoucherQrCodeData = (
  rawValue: string
): MemberVoucherQrCodeData | null => {
  const trimmed = rawValue.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (isMemberVoucherQrCodeData(parsed)) {
      return parsed;
    }
  } catch {
    // Fall back to the legacy delimiter format below.
  }

  const parts = trimmed.split("-");
  if (parts.length < 5) {
    return null;
  }

  const [voucherId, eventId, useCaseId, networkId, ...rest] = parts;

  if (!voucherId || !eventId || !useCaseId || !networkId || rest.length === 0) {
    return null;
  }

  return {
    voucherId,
    eventId,
    useCaseId,
    networkId,
    userId: rest.join("-"),
  };
};
