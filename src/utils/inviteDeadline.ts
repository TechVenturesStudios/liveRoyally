function toDateKey(value: Date | string | null | undefined) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().slice(0, 10);
}

export function isDeadlinePassed(deadline: Date | string | null | undefined, reference = new Date()) {
  const deadlineKey = toDateKey(deadline);
  if (!deadlineKey) return false;

  const referenceKey = toDateKey(reference);
  if (!referenceKey) return false;

  return referenceKey > deadlineKey;
}
