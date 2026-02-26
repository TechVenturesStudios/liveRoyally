export const getLoggedInUser = (): any | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const getLoggedInMemberId = (): string | null => {
  const u = getLoggedInUser();
  const id = u?.id || u?.user_id || u?.userId;
  if (!id) return null;

  const userType = (u?.userType || u?.user_type || "").toLowerCase();
  if (userType && userType !== "member") return null;

  return String(id);
};
