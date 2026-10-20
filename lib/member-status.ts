const MEMBER_NEW_ACCOUNT_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export function isMemberActive(
  createdAt: Date | null | undefined,
  hasClaimedVoucher: boolean,
  now = new Date()
) {
  if (hasClaimedVoucher) return true;
  if (!createdAt) return false;
  return createdAt.getTime() > now.getTime() - MEMBER_NEW_ACCOUNT_WINDOW_MS;
}
