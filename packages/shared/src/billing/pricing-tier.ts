export type BillingEstimate = {
  count: number;
  monthly: number;
};

const STEPS = [
  { price: 4, upTo: 5 },
  { price: 3, upTo: 10 },
  { price: 2, upTo: 20 },
  { price: 1, upTo: Number.POSITIVE_INFINITY },
];

/** Suma el precio de cada puesto: 1-5 a 4 €, 6-10 a 3 €, 11-20 a 2 € y el resto a 1 €. */
export function estimateBilling(count: number): BillingEstimate {
  const clients = Math.max(0, Math.floor(count));
  let monthly = 0;
  let previous = 0;
  let remaining = clients;
  for (const step of STEPS) {
    const width = Math.min(remaining, step.upTo - previous);
    monthly += width * step.price;
    remaining -= width;
    previous = step.upTo;
    if (remaining <= 0) break;
  }
  return { count: clients, monthly };
}
