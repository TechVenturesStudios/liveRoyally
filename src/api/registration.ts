export async function registerMember(input: Record<string, unknown>) {
  const response = await fetch("/api/register-member", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create DB user");
  }

  return data as {
    message: string;
    userId: string;
    displayId: string;
    partnerId: string;
  };
}

export async function registerProvider(input: Record<string, unknown>) {
  const response = await fetch("/api/register-provider", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create DB user");
  }

  return data as { message: string; userId: string; displayId: string };
}

export async function registerPartner(input: Record<string, unknown>) {
  const response = await fetch("/api/register-partner", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create partner");
  }

  return data as {
    message: string;
    userId: string;
    displayId: string;
    partnerCode: string;
    subscriptionId: string;
  };
}
