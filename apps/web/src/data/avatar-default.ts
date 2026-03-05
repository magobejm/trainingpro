import { readFrontEnv } from './env';

const AVATAR_NAMES = [
  'pixar-robot-neutral.svg',
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

export function listAvailableAvatarUrls(): string[] {
  const baseUrl = resolveAvatarBaseUrl();
  return AVATAR_NAMES.map((name) => `${baseUrl}/assets/avatars/${name}`);
}

export function resolveDefaultAvatarUrl(seed: string): string {
  void seed;
  const baseUrl = resolveAvatarBaseUrl();
  return `${baseUrl}/assets/avatars/pixar-robot-neutral.svg`;
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
