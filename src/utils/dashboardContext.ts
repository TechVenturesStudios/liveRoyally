export type DashboardContextMode = "member" | "rep";
export type DashboardContextTarget = "member" | "provider" | "partner";

export interface DashboardContext {
  mode: DashboardContextMode;
  assignmentId?: string;
  targetType?: DashboardContextTarget;
  targetLabel?: string;
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

export const getEffectiveDashboardType = (defaultType?: DashboardContextTarget): DashboardContextTarget | undefined => {
  const context = getDashboardContext();

  if (defaultType === "member" && context?.mode === "rep" && context.targetType) {
    return context.targetType;
  }

  return defaultType;
};

export const buildDashboardQuery = (cognitoId?: string) => {
  const params = new URLSearchParams();

  if (cognitoId) {
    params.set("cognitoId", cognitoId);
  }

  const context = getDashboardContext();
  if (context?.mode === "rep" && context.assignmentId) {
    params.set("actingAsAssignmentId", context.assignmentId);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
};
