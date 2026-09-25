export function circularRingMetrics(
  size: number,
  strokeWidth: number,
): {
  circumference: number;
  cx: number;
  cy: number;
  radius: number;
} {
  const radius = Math.max(0, (size - strokeWidth) / 2);
  return {
    circumference: 2 * Math.PI * radius,
    cx: size / 2,
    cy: size / 2,
    radius,
  };
}

export function circularProgressOffset(remaining: number, totalSeconds: number, circumference: number): number {
  if (totalSeconds <= 0 || circumference <= 0) {
    return circumference;
  }
  const ratio = Math.min(1, Math.max(0, remaining / totalSeconds));
  return circumference * (1 - ratio);
}
