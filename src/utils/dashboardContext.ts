export type DashboardContextMode = "member" | "rep";
export type DashboardContextTarget = "member" | "provider" | "partner" | "admin";

export interface DashboardContext {
  mode: DashboardContextMode;
  assignmentId?: string;
  targetType?: DashboardContextTarget;
  targetLabel?: string;
  targetId?: string;
  ownerCognitoId?: string;
}

const DASHBOARD_CONTEXT_KEY = "dashboard-context";

export const getDashboardContext = (): DashboardContext | null => {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(DASHBOARD_CONTEXT_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as DashboardContext;
  } catch {
    return null;
  }
};

export const setDashboardContext = (context: DashboardContext | null) => {
  if (typeof window === "undefined") return;

  if (!context) {
    sessionStorage.removeItem(DASHBOARD_CONTEXT_KEY);
    return;
  }

  sessionStorage.setItem(DASHBOARD_CONTEXT_KEY, JSON.stringify(context));
};

export const clearDashboardContext = () => setDashboardContext(null);

export const getEffectiveDashboardType = (
  defaultType?: DashboardContextTarget,
  currentCognitoId?: string
): DashboardContextTarget | undefined => {
  const context = getDashboardContext();

  if (
    context?.mode === "rep" &&
    context.targetType &&
    currentCognitoId &&
    context.ownerCognitoId === currentCognitoId
  ) {
    return context.targetType;
  }

  return defaultType;
};

export const isAuthorizedRepresentativeView = (currentCognitoId: string) => {
  const context = getDashboardContext();
  return (
    context?.mode === "rep" &&
    Boolean(context.assignmentId) &&
    Boolean(context.targetType) &&
    Boolean(context.ownerCognitoId) &&
    context.ownerCognitoId === currentCognitoId
  );
};

export const getRepresentativeCapabilities = (currentCognitoId: string) => {
  const context = getDashboardContext();
  if (!isAuthorizedRepresentativeView(currentCognitoId)) {
    return { canCreateEvents: true, canRunReports: true, canScanVouchers: true, canManageInvites: true };
  }

  if (context?.targetType === "partner") {
    return { canCreateEvents: true, canRunReports: true, canScanVouchers: false, canManageInvites: false };
  }

  if (context?.targetType === "provider") {
    return { canCreateEvents: false, canRunReports: true, canScanVouchers: true, canManageInvites: false };
  }

  return { canCreateEvents: false, canRunReports: false, canScanVouchers: false, canManageInvites: false };
};

export const buildDashboardQuery = (cognitoId?: string) => {
  const params = new URLSearchParams();

  if (cognitoId) {
    params.set("cognitoId", cognitoId);
  }

  const context = getDashboardContext();
  if (
    context?.mode === "rep" &&
    context.assignmentId &&
    cognitoId &&
    context.ownerCognitoId === cognitoId
  ) {
    params.set("actingAsAssignmentId", context.assignmentId);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
};
