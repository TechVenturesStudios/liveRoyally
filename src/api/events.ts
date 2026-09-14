type CreateEventInput = {
  partnerId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  eventTime?: string;
  networkPoints?: string | number;
  memberPrice?: string | number;
  totalVouchersAvailable?: string | number;
  responseDeadline?: string;
  providerIds?: string[];
};

export async function createEvent(input: CreateEventInput) {
  const response = await fetch("/api/create-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create event");
  }

  return data as {
    message: string;
    eventId: string;
    notifications?: {
      sent: number;
      failed: number;
    };
  };
}

export async function publishEvent(eventId: string) {
  const response = await fetch("/api/publish-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to publish event");
  return data as { event: { id: string; published: boolean; publishedAt: string } };
}
