type CreateEventInput = {
  partnerId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  eventTime?: string;
  networkPoints?: string | number;
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
  };
}
