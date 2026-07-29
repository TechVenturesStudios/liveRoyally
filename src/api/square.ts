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
