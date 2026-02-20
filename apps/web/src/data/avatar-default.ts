import { readFrontEnv } from './env';

const AVATAR_NAMES = [
  'avatar-01.png',
  'avatar-02.png',
  'avatar-03.png',
  'avatar-04.png',
  'avatar-05.png',
  'avatar-06.png',
  'avatar-07.png',
  'avatar-08.png',
  'pixar-1.png',
  'pixar-2.png',
  'pixar-3.png',
  'pixar-4.png',
  'pixar-5.png',
  'pixar-6.png',
];

export function resolveDefaultAvatarUrl(seed: string): string {
  const baseUrl = resolveAvatarBaseUrl();
  const index = hashSeed(seed) % AVATAR_NAMES.length;
  return `${baseUrl}/assets/avatars/${AVATAR_NAMES[index]}`;
}

export function resolveRandomAvatarUrl(): string {
  const baseUrl = resolveAvatarBaseUrl();
  const index = Math.floor(Math.random() * AVATAR_NAMES.length);
  return `${baseUrl}/assets/avatars/${AVATAR_NAMES[index]}`;
}

function resolveAvatarBaseUrl(): string {
  const env = readFrontEnv();
  return env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
}

function hashSeed(input: string): number {
  let value = 0;
  for (let index = 0; index < input.length; index += 1) {
    value = (value * 31 + input.charCodeAt(index)) >>> 0;
  }
  return value;
}
