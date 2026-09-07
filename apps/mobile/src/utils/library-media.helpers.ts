export type LibraryMediaCategory = 'cardio' | 'isometric' | 'mobility' | 'plio' | 'sport' | 'strength';

function resolveApiBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

const API_BASE_URL = resolveApiBaseUrl();

const PLACEHOLDERS: Record<LibraryMediaCategory, string> = {
  strength: `${API_BASE_URL}/assets/placeholders/routine-placeholder.jpg`,
  cardio: `${API_BASE_URL}/assets/placeholders/cardio-bg.jpg`,
  isometric: `${API_BASE_URL}/assets/placeholders/isometric-placeholder.png`,
  plio: `${API_BASE_URL}/assets/placeholders/plio-placeholder.png`,
  mobility: `${API_BASE_URL}/assets/placeholders/warmup-placeholder.png`,
  sport: `${API_BASE_URL}/assets/placeholders/sports-placeholder.png`,
};

export function resolvePlaceholder(category: LibraryMediaCategory): string {
  return PLACEHOLDERS[category] ?? PLACEHOLDERS.strength;
}

export function getFullMediaUrl(category: LibraryMediaCategory, url: null | string | undefined): string {
  const placeholder = resolvePlaceholder(category);
  if (!url || typeof url !== 'string' || url.trim() === '') return placeholder;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export function toYouTubeEmbedUrl(value: null | string): null | string {
  if (!value) return null;
  const videoId = readYouTubeVideoId(value);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
}

export function getYouTubeThumbnailUrl(value: null | string): null | string {
  if (!value) return null;
  const videoId = readYouTubeVideoId(value);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function readYouTubeVideoId(raw: string): null | string {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'youtu.be') {
      return url.pathname.split('/').filter(Boolean)[0] ?? null;
    }
    if (host !== 'youtube.com') {
      return null;
    }
    if (url.pathname === '/watch') {
      return url.searchParams.get('v');
    }
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments[0] === 'embed' || segments[0] === 'shorts') {
      return segments[1] ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

export function buildYouTubePlayerUrl(youtubeUrl: string): null | string {
  const embedUrl = toYouTubeEmbedUrl(youtubeUrl);
  if (!embedUrl) return null;
  return `${embedUrl}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
}
