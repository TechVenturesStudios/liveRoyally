import "dotenv/config";

const apiVersion = process.env.SQUARE_VERSION ?? "2026-07-15";

const squareEnvironment = (
  process.env.SQUARE_ENVIRONMENT ?? "sandbox"
).toLowerCase();

const rawAccessToken = process.env.SQUARE_ACCESS_TOKEN;
const accessToken = rawAccessToken?.replace(/\s+/g, "");

const baseUrl =
  squareEnvironment === "production" || squareEnvironment === "prod"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";

if (!accessToken) {
  console.error("Missing SQUARE_ACCESS_TOKEN in the environment.");
  process.exit(1);
}

if (rawAccessToken !== accessToken) {
  console.warn("Normalized whitespace out of SQUARE_ACCESS_TOKEN before use.");
}

console.log(
  `Using Square ${
    squareEnvironment === "production" || squareEnvironment === "prod"
      ? "production"
      : "sandbox"
  } API at ${baseUrl}`
);

/**
 * ============================================================
 * PLANS
 * ============================================================
 *
 * Amounts are in cents.
 *
 * Change these amounts to your actual annual prices.
 */

const plans = [
  {
    key: "starter",
    planName: "Starter Membership",
    variationName: "Starter Annual",
    amount: 0,
    currency: "USD",
  },
  {
    key: "spotlight",
    planName: "Spotlight Membership",
    variationName: "Spotlight Annual",
    amount: 100000,
    currency: "USD",
  },
  {
    key: "standard",
    planName: "Standard Membership",
    variationName: "Standard Annual",
    amount: 187500,
    currency: "USD",
  },
  {
    key: "premium",
    planName: "Premium Membership",
    variationName: "Premium Annual",
    amount: 300000,
    currency: "USD",
  },
  {
    key: "enterprise",
    planName: "Enterprise Membership",
    variationName: "Enterprise Annual",
    amount: 500000,
    currency: "USD",
  },
  {
    // Provider subscription bought through the Live Royally join flow.
    // Prints SQUARE_PLAN_VARIATION_LIVE_ROYALLY_PROVIDER_ANNUAL_ID.
    key: "live_royally_provider",
    planName: "Live Royally Provider Membership",
    variationName: "Live Royally Provider Annual",
    amount: 10000,
    currency: "USD",
  },
];

/**
 * ============================================================
 * SQUARE API REQUEST
 * ============================================================
 */

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
      ? payload.errors
          .map(
            (error) =>
              `${error.category ?? "Error"}: ${
                error.detail ?? error.code ?? "Unknown"
              }`
          )
          .join("; ")
      : JSON.stringify(payload);

    throw new Error(
      `Square request failed for ${path}: ${details}`
    );
  }

  return payload;
}

/**
 * ============================================================
 * FIND CATALOG OBJECT BY NAME
 * ============================================================
 */

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

  const dataKey = `${objectType.toLowerCase()}_data`;

  return (
    payload.objects?.find(
      (object) =>
        object.type === objectType &&
        object?.[dataKey]?.name === name
    ) ?? null
  );
}

/**
 * ============================================================
 * UPSERT CATALOG OBJECT
 * ============================================================
 */

async function upsertCatalogObject(object, idempotencyKey) {
  const payload = await squareRequest("/v2/catalog/object", {
    idempotency_key: idempotencyKey,
    object,
  });

  return payload.catalog_object;
}

/**
 * ============================================================
 * GET OR CREATE SUBSCRIPTION PLAN
 * ============================================================
 *
 * IMPORTANT:
 *
 * If the plan already exists:
 *   - We DO NOT update it.
 *   - We simply return its ID.
 *
 * If it doesn't exist:
 *   - We create it.
 *
 * This prevents Square from thinking we are removing existing
 * variations from an existing plan.
 * ============================================================
 */

async function getOrCreateSubscriptionPlan(planConfig) {
  const existingPlan = await findCatalogObjectByName(
    "SUBSCRIPTION_PLAN",
    planConfig.planName
  );

  if (existingPlan) {
    console.log(
      `Found existing plan "${planConfig.planName}": ${existingPlan.id}`
    );

    return {
      planId: existingPlan.id,
      created: false,
    };
  }

  console.log(
    `Plan "${planConfig.planName}" does not exist. Creating it...`
  );

  const temporaryPlanId = `#${planConfig.key}-plan`;

  const planObject = {
    id: temporaryPlanId,

    type: "SUBSCRIPTION_PLAN",

    present_at_all_locations: true,

    subscription_plan_data: {
      name: planConfig.planName,

      all_items: true,
    },
  };

  const idempotencyKey =
    `localmetrics-${planConfig.key}-plan-2026-${Date.now()}`;

  const createdPlan = await upsertCatalogObject(
    planObject,
    idempotencyKey
  );

  console.log(
    `Created plan "${planConfig.planName}": ${createdPlan.id}`
  );

  return {
    planId: createdPlan.id,
    created: true,
  };
}

/**
 * ============================================================
 * CREATE ANNUAL VARIATION
 * ============================================================
 */

/**
 * A variation auto-renews only if its final phase has no `periods`.
 */
function variationAutoRenews(variation) {
  const phases =
    variation?.subscription_plan_variation_data?.phases ?? [];
  const finalPhase = [...phases].sort(
    (a, b) => Number(a.ordinal ?? 0) - Number(b.ordinal ?? 0)
  ).at(-1);

  return Boolean(finalPhase) && finalPhase.periods == null;
}

async function createAnnualVariation(planConfig, planId) {
  /**
   * ----------------------------------------------------------
   * Reuse an existing auto-renewing annual variation.
   *
   * Older variations were created with `periods: 1`, so they end
   * after the first year. Phases can't be edited, so those are
   * skipped and a new "<name> (Auto-Renew)" variation is created.
   * ----------------------------------------------------------
   */

  let variationName = planConfig.variationName;

  const existingAnnualVariation =
    await findCatalogObjectByName(
      "SUBSCRIPTION_PLAN_VARIATION",
      variationName
    );

  if (existingAnnualVariation && !variationAutoRenews(existingAnnualVariation)) {
    console.warn(
      `Annual variation "${variationName}" (${existingAnnualVariation.id}) does not auto-renew; skipping it.`
    );

    variationName = `${planConfig.variationName} (Auto-Renew)`;

    const existingRenewingVariation =
      await findCatalogObjectByName(
        "SUBSCRIPTION_PLAN_VARIATION",
        variationName
      );

    if (existingRenewingVariation) {
      console.log(
        `Annual variation "${variationName}" already exists: ${existingRenewingVariation.id}`
      );

      return {
        variationId: existingRenewingVariation.id,
        variationName,
        created: false,
      };
    }
  } else if (existingAnnualVariation) {
    console.log(
      `Annual variation "${variationName}" already exists: ${existingAnnualVariation.id}`
    );

    return {
      variationId: existingAnnualVariation.id,
      variationName,
      created: false,
    };
  }

  /**
   * ----------------------------------------------------------
   * Create new annual variation
   * ----------------------------------------------------------
   */

  console.log(
    `Creating annual variation "${variationName}"...`
  );

  const temporaryVariationId =
    `#${planConfig.key}-annual-variation`;

  const variationObject = {
    id: temporaryVariationId,

    type: "SUBSCRIPTION_PLAN_VARIATION",

    present_at_all_locations: true,

    subscription_plan_variation_data: {
      name: variationName,

      subscription_plan_id: planId,

      phases: [
        {
          cadence: "ANNUAL",

          // No `periods`: Square ends a subscription after a final phase
          // that has a fixed number of periods. Leaving it unset makes the
          // phase repeat every year until the subscription is canceled.

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

  /**
   * New idempotency key.
   *
   * This is intentionally different from the idempotency keys
   * used by your old monthly subscription script.
   */

  const idempotencyKey =
    `localmetrics-${planConfig.key}-annual-2026-${Date.now()}`;

  const createdVariation = await upsertCatalogObject(
    variationObject,
    idempotencyKey
  );

  console.log(
    `Created annual variation "${variationName}": ${createdVariation.id}`
  );

  return {
    variationId: createdVariation.id,
    variationName,
    created: true,
  };
}

/**
 * ============================================================
 * PROCESS PLAN
 * ============================================================
 */

async function processPlan(planConfig) {
  console.log(
    `\n------------------------------------------------------------`
  );

  console.log(
    `Processing ${planConfig.planName}`
  );

  console.log(
    `------------------------------------------------------------`
  );

  /**
   * Get existing plan OR create it if it doesn't exist.
   */

  const planResult =
    await getOrCreateSubscriptionPlan(planConfig);

  /**
   * Create annual variation under that plan.
   */

  const variationResult =
    await createAnnualVariation(
      planConfig,
      planResult.planId
    );

  return {
    key: planConfig.key,

    planName: planConfig.planName,

    variationName: variationResult.variationName,

    planId: planResult.planId,

    variationId: variationResult.variationId,

    amount: planConfig.amount,

    currency: planConfig.currency,

    planCreated: planResult.created,

    variationCreated: variationResult.created,
  };
}

/**
 * ============================================================
 * MAIN
 * ============================================================
 */

async function main() {
  const results = [];

  console.log(
    "\n============================================================"
  );

  console.log(
    "Creating Square Annual Subscription Plans / Variations"
  );

  console.log(
    "============================================================"
  );

  for (const plan of plans) {
    const result = await processPlan(plan);

    results.push(result);
  }

  /**
   * ----------------------------------------------------------
   * Results
   * ----------------------------------------------------------
   */

  console.log(
    "\n============================================================"
  );

  console.log("RESULTS");

  console.log(
    "============================================================\n"
  );

  console.table(
    results.map((result) => ({
      key: result.key,

      planName: result.planName,

      planId: result.planId,

      variationName: result.variationName,

      variationId: result.variationId,

      price: `${(result.amount / 100).toFixed(2)} ${
        result.currency
      }`,

      planCreated: result.planCreated,

      variationCreated: result.variationCreated,
    }))
  );

  /**
   * ----------------------------------------------------------
   * Environment variables
   * ----------------------------------------------------------
   */

  console.log(
    "\n============================================================"
  );

  console.log("ENVIRONMENT VARIABLES");

  console.log(
    "============================================================\n"
  );

  for (const result of results) {
    console.log(
      `SQUARE_PLAN_VARIATION_${result.key.toUpperCase()}_ANNUAL_ID=${result.variationId}`
    );
  }

  console.log(
    "\n============================================================"
  );

  console.log("COMPLETE");

  console.log(
    "============================================================\n"
  );

  console.log(
    "Existing plans and monthly variations were not modified."
  );

  console.log(
    "Existing plans received new annual variations."
  );

  console.log(
    "Missing plans were created with new annual variations."
  );
}

/**
 * ============================================================
 * ERROR HANDLING
 * ============================================================
 */

main().catch((error) => {
  console.error(
    "\nFailed to create Square annual subscription plans/variations.\n"
  );

  console.error(
    error instanceof Error
      ? error.message
      : error
  );

  process.exit(1);
});