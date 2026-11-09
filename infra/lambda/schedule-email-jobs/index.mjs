import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";

const routes = [
  "/api/jobs/schedule-voucher-expiring",
  "/api/jobs/schedule-member-inactive",
  "/api/jobs/schedule-partner-inactive",
  "/api/jobs/schedule-upcoming-event-reminders",
  "/api/jobs/schedule-campaign-results",
];

const ssm = new SSMClient({});
let cachedSecret;

async function getSchedulerSecret() {
  if (cachedSecret) return cachedSecret;

  const name = process.env.EMAIL_SCHEDULER_SECRET_PARAM;
  if (!name) {
    throw new Error("EMAIL_SCHEDULER_SECRET_PARAM is not configured");
  }

  const response = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  cachedSecret = response.Parameter?.Value;
  if (!cachedSecret) {
    throw new Error(`${name} has no value`);
  }
  return cachedSecret;
}

export const handler = async () => {
  const appUrl = process.env.APP_URL?.replace(/\/$/, "");
  if (!appUrl) {
    throw new Error("APP_URL is not configured");
  }

  const secret = await getSchedulerSecret();

  const results = await Promise.all(
    routes.map(async (route) => {
      const response = await fetch(`${appUrl}${route}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
        },
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          `${route} failed with ${response.status}: ${responseText}`,
        );
      }

      return {
        route,
        status: response.status,
        response: responseText,
      };
    }),
  );

  console.log(JSON.stringify(results));

  return {
    statusCode: 200,
    results,
  };
};
