export type PricingTier = {
  fromClients: number;
  monthlyPrice: number;
  toClients: number | null;
};

export type BillingEstimate = {
  clientsToNext: number | null;
  estimatedMonthly: number;
  nextTier: PricingTier | null;
  tier: PricingTier | null;
};

export function estimateBilling(activeClients: number, tiers: PricingTier[]): BillingEstimate {
  const sorted = [...tiers].sort((left, right) => left.fromClients - right.fromClients);
  const tier =
    sorted.find(
      (item) => activeClients >= item.fromClients && (item.toClients == null || activeClients <= item.toClients),
    ) ?? null;
  const nextTier = tier
    ? (sorted.find((item) => item.fromClients > (tier.toClients ?? activeClients)) ?? null)
    : (sorted[0] ?? null);
  return {
    clientsToNext: nextTier ? Math.max(0, nextTier.fromClients - activeClients) : null,
    estimatedMonthly: tier?.monthlyPrice ?? 0,
    nextTier: tier ? nextTier : null,
    tier,
  };
}
