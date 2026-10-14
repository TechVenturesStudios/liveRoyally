import { buildDashboardQuery } from "@/utils/dashboardContext";

export async function fetchSquareConfig() {
  const response = await fetch("/api/square-config", {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to load Square configuration");
  }

  return data as {
    applicationId: string;
    locationId: string;
    environment: string;
  };
}

export async function fetchSquareConnection() {
  const response = await fetch(`/api/square/oauth/connection${buildDashboardQuery()}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to check Square connection");
  }

  return { connected: Boolean(data.connected) };
}
