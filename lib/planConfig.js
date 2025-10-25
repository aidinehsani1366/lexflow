export const PLAN_PRESETS = {
  solo: {
    priceId: process.env.STRIPE_PRICE_SOLO || process.env.NEXT_PUBLIC_STRIPE_PRICE_SOLO || "",
    seat_limit: 1,
    docs_quota: 100,
    ai_quota: 300,
  },
  team: {
    priceId: process.env.STRIPE_PRICE_TEAM || process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM || "",
    seat_limit: 10,
    docs_quota: 1000,
    ai_quota: 2000,
  },
  firm: {
    priceId: process.env.STRIPE_PRICE_FIRM || process.env.NEXT_PUBLIC_STRIPE_PRICE_FIRM || "",
    seat_limit: 1000,
    docs_quota: 100000,
    ai_quota: 100000,
  },
};

export const PRICE_TO_PLAN = Object.entries(PLAN_PRESETS).reduce((acc, [plan, cfg]) => {
  if (cfg.priceId) acc[cfg.priceId] = plan;
  return acc;
}, {});
