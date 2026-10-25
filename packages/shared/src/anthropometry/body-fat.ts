export type SkinfoldSites = {
  abdomen?: number;
  chest?: number;
  midaxillary?: number;
  subscapular?: number;
  suprailiac?: number;
  thigh?: number;
  triceps?: number;
};

export function jacksonPollock3(input: { age: number; sex: 'female' | 'male'; sites: SkinfoldSites }): number | null {
  const sum =
    input.sex === 'male'
      ? sumOf(input.sites, ['chest', 'abdomen', 'thigh'])
      : sumOf(input.sites, ['triceps', 'suprailiac', 'thigh']);
  if (sum == null) return null;
  const density =
    input.sex === 'male'
      ? 1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * input.age
      : 1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * input.age;
  return bodyFatFromDensity(density);
}

export function jacksonPollock7(input: { age: number; sex: 'female' | 'male'; sites: SkinfoldSites }): number | null {
  const sum = sumOf(input.sites, ['chest', 'midaxillary', 'triceps', 'subscapular', 'abdomen', 'suprailiac', 'thigh']);
  if (sum == null) return null;
  const density =
    input.sex === 'male'
      ? 1.112 - 0.00043499 * sum + 0.00000055 * sum * sum - 0.00028826 * input.age
      : 1.097 - 0.00046971 * sum + 0.00000056 * sum * sum - 0.00012828 * input.age;
  return bodyFatFromDensity(density);
}

function sumOf(sites: SkinfoldSites, keys: (keyof SkinfoldSites)[]): number | null {
  let total = 0;
  for (const key of keys) {
    const value = sites[key];
    if (value == null || value < 0) return null;
    total += value;
  }
  return total;
}

function bodyFatFromDensity(density: number): number | null {
  if (density <= 0) return null;
  return Math.round((495 / density - 450) * 10) / 10;
}
