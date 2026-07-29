import "dotenv/config";

const apiVersion = process.env.SQUARE_VERSION ?? "2026-07-15";
const squareEnvironment = (process.env.SQUARE_ENVIRONMENT ?? "sandbox").toLowerCase();
const rawAccessToken = process.env.SQUARE_ACCESS_TOKEN;
const accessToken = rawAccessToken?.replace(/\s+/g, "");
const baseUrl =
  (squareEnvironment === "production" || squareEnvironment === "prod"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com");

if (!accessToken) {
  console.error("Missing SQUARE_ACCESS_TOKEN in the environment.");
  process.exit(1);
}

if (rawAccessToken !== accessToken) {
  console.warn("Normalized whitespace out of SQUARE_ACCESS_TOKEN before use.");
}

console.log(`Using Square ${squareEnvironment === "production" || squareEnvironment === "prod" ? "production" : "sandbox"} API at ${baseUrl}`);

const plans = [
  {
    key: "spotlight",
    planName: "Spotlight Membership",
    variationName: "Spotlight Monthly",
    amount: 4900,
    currency: "USD",
  },
  {
    key: "standard",
    planName: "Standard Membership",
    variationName: "Standard Monthly",
    amount: 9900,
    currency: "USD",
  },
  {
    key: "premium",
    planName: "Premium Membership",
    variationName: "Premium Monthly",
    amount: 19900,
    currency: "USD",
  },
];

async function squareRequest(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Square-Version": apiVersion,
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const details = payload?.errors?.length
      ? payload.errors.map((error) => `${error.category ?? "Error"}: ${error.detail ?? error.code ?? "Unknown"}`).join("; ")
      : JSON.stringify(payload);
    throw new Error(`Square request failed for ${path}: ${details}`);
  }

  return payload;
}

async function findCatalogObjectByName(objectType, name) {
  const payload = await squareRequest("/v2/catalog/search", {
    object_types: [objectType],
    query: {
      exact_query: {
        attribute_name: "name",
        attribute_value: name,
      },
    },
  });

  return payload.objects?.find((object) => object.type === objectType && object?.[`${objectType.toLowerCase()}_data`]?.name === name) ?? null;
}

async function upsertCatalogObject(object, idempotencyKey) {
  const payload = await squareRequest("/v2/catalog/object", {
    idempotency_key: idempotencyKey,
    object,
  });

  return payload.catalog_object;
}

async function createOrUpdatePlan(planConfig) {
  const existingPlan = await findCatalogObjectByName("SUBSCRIPTION_PLAN", planConfig.planName);
  const planId = existingPlan?.id ?? `#${planConfig.key}-plan`;

  const planObject = {
    id: planId,
    type: "SUBSCRIPTION_PLAN",
    present_at_all_locations: true,
    subscription_plan_data: {
      name: planConfig.planName,
      all_items: true,
    },
  };

  const createdPlan = await upsertCatalogObject(planObject, `liveRoyally-${planConfig.key}-plan`);

  const existingVariation = await findCatalogObjectByName(
    "SUBSCRIPTION_PLAN_VARIATION",
    planConfig.variationName
  );
  const variationId = existingVariation?.id ?? `#${planConfig.key}-variation`;

  const variationObject = {
    id: variationId,
    type: "SUBSCRIPTION_PLAN_VARIATION",
    present_at_all_locations: true,
    subscription_plan_variation_data: {
      name: planConfig.variationName,
      subscription_plan_id: createdPlan.id,
      phases: [
        {
          cadence: "MONTHLY",
          periods: 1,
          ordinal: 0,
          pricing: {
            type: "STATIC",
            price_money: {
              amount: planConfig.amount,
              currency: planConfig.currency,
            },
          },
        },
      ],
    },
  };

  const createdVariation = await upsertCatalogObject(
    variationObject,
    `liveRoyally-${planConfig.key}-variation`
  );

  return {
    key: planConfig.key,
    planName: planConfig.planName,
    variationName: planConfig.variationName,
    planId: createdPlan.id,
    variationId: createdVariation.id,
    amount: planConfig.amount,
    currency: planConfig.currency,
  };
}

async function main() {
  const results = [];

  for (const plan of plans) {
    results.push(await createOrUpdatePlan(plan));
  }

  console.log("\nSquare subscription plans created or updated successfully.\n");
  console.table(
    results.map((result) => ({
      key: result.key,
      planId: result.planId,
      variationId: result.variationId,
      price: `${(result.amount / 100).toFixed(2)} ${result.currency}`,
    }))
  );

  console.log("\nUse these variation IDs in your app:\n");
  for (const result of results) {
    console.log(`SQUARE_PLAN_VARIATION_${result.key.toUpperCase()}_ID=${result.variationId}`);
  }
}

main().catch((error) => {
  console.error("\nFailed to create Square subscription plans.\n");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
