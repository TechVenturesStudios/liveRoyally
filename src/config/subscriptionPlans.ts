export const PARTNER_SUBSCRIPTION_PLANS = {
  spotlight: {
    value: "spotlight",
    label: "Spotlight",
    price: "$49/mo",
    monthlyPrice: 49,
    monthlyPriceCents: 4900,
    maxProviders: 5,
    description: "Basic visibility with network listing and up to 5 providers.",
    features: ["Network listing", "Up to 5 providers", "Basic analytics", "Email support"],
  },
  standard: {
    value: "standard",
    label: "Standard",
    price: "$99/mo",
    monthlyPrice: 99,
    monthlyPriceCents: 9900,
    maxProviders: 25,
    description: "Enhanced tools with campaigns, events, and up to 25 providers.",
    features: [
      "Everything in Spotlight",
      "Up to 25 providers",
      "Campaign management",
      "Event creation",
      "Priority support",
    ],
  },
  premium: {
    value: "premium",
    label: "Premium",
    price: "$199/mo",
    monthlyPrice: 199,
    monthlyPriceCents: 19900,
    maxProviders: null,
    description: "Full platform access with unlimited providers and advanced CRM.",
    features: [
      "Everything in Standard",
      "Unlimited providers",
      "Advanced CRM & analytics",
      "Custom branding",
      "Dedicated account manager",
    ],
  },
} as const;

export type PartnerSubscriptionPlan = keyof typeof PARTNER_SUBSCRIPTION_PLANS;

export const PARTNER_SUBSCRIPTION_PLAN_LIST = Object.values(PARTNER_SUBSCRIPTION_PLANS);
