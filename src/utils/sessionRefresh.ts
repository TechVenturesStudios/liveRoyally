import { getUserFromStorage, removeUserFromStorage } from "@/utils/userStorage";

let refreshInFlight: Promise<boolean> | null = null;

function refreshSession() {
  refreshInFlight ??= fetch("/api/auth/refresh", { method: "POST" })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

function apiPath(input: RequestInfo | URL) {
  const url = new URL(input instanceof Request ? input.url : String(input), window.location.origin);
  return url.origin === window.location.origin ? url.pathname : null;
}

// The ID token cookie lasts an hour. When an API call comes back 401 for a signed-in
// user, trade the refresh token cookie for a new session and retry the call once. If
// the refresh fails the session is over, so send the user back to sign in.
export function installSessionRefresh() {
  if (typeof window === "undefined" || (window.fetch as { sessionRefresh?: boolean }).sessionRefresh) {
    return;
  }

  const originalFetch = window.fetch.bind(window);

  const fetchWithRefresh = async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = apiPath(input);
    if (!path?.startsWith("/api/") || path.startsWith("/api/auth/")) {
      return originalFetch(input, init);
    }

    const retryInput = input instanceof Request ? input.clone() : input;
    const response = await originalFetch(input, init);

    if (response.status !== 401 || !getUserFromStorage()) {
      return response;
    }

    if (await refreshSession()) {
      return originalFetch(retryInput, init);
    }

    removeUserFromStorage();
    window.location.assign("/login");
    return response;
  };

  window.fetch = Object.assign(fetchWithRefresh, { sessionRefresh: true });
}
