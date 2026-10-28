import { formatHeartRateBand, parseHeartRateBand, type HeartRateBand, type HeartRateBandKind } from '@trainerpro/shared';

export function commitSeriesBand(
  raw: string,
  kind: HeartRateBandKind,
  previous: HeartRateBand,
): HeartRateBand & { text: string } {
  const parsed = parseHeartRateBand(raw, kind) ?? previous;
  return { max: parsed.max, min: parsed.min, text: formatHeartRateBand(parsed.min, parsed.max) };
}
