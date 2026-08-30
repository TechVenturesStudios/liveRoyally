export type EventLifecycleStatus = "pending" | "active" | "completed";

type EventLifecycleInput = {
  startDate?: Date | string | null | undefined;
  endDate?: Date | string | null | undefined;
  responseDeadline?: Date | string | null | undefined;
  inviteStatuses?: Array<string | null | undefined>;
  referenceDate?: Date;
};

function toDateKey(value: Date | string | null | undefined) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().slice(0, 10);
}

function isBeforeReferenceDay(value: Date | string | null | undefined, reference: Date) {
  const valueKey = toDateKey(value);
  const referenceKey = toDateKey(reference);

  if (!valueKey || !referenceKey) return false;

  return valueKey < referenceKey;
}

export function deriveEventLifecycleStatus({
  startDate,
  endDate,
  responseDeadline,
  inviteStatuses = [],
  referenceDate = new Date(),
}: EventLifecycleInput): EventLifecycleStatus {
  if (isBeforeReferenceDay(endDate ?? startDate, referenceDate)) {
    return "completed";
  }

  const allProvidersResponded =
    inviteStatuses.length > 0 && inviteStatuses.every((status) => String(status ?? "").trim().toLowerCase() !== "pending");

  if (allProvidersResponded) {
    return "active";
  }

  if (isBeforeReferenceDay(responseDeadline, referenceDate)) {
    return "active";
  }

  return "pending";
}

export function normalizeEventStage(status: EventLifecycleStatus): "needs_approval" | "upcoming" | "past" {
  switch (status) {
    case "pending":
      return "needs_approval";
    case "active":
      return "upcoming";
    case "completed":
      return "past";
  }
}
