export type WearableMetric = {
  date: string;
  hrvMs: number | null;
  restingHr: number | null;
  sleepMinutes: number | null;
  source: string;
  steps: number | null;
};

export type WearableDayView = {
  date: string;
  hrvMs: number | null;
  restingHr: number | null;
  sleepHours: number | null;
  source: string;
  steps: number | null;
};

/** Coach-facing day: sleep is shown in hours, and a null field means that sample was not sent. */
export function describeWearableDay(metric: WearableMetric): WearableDayView {
  return {
    date: metric.date,
    hrvMs: metric.hrvMs,
    restingHr: metric.restingHr,
    sleepHours: metric.sleepMinutes == null ? null : Math.round((metric.sleepMinutes / 60) * 10) / 10,
    source: metric.source,
    steps: metric.steps,
  };
}
