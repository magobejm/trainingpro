const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 1_000_000;

export async function pickLibraryImageFile(): Promise<File | null> {
  if (typeof document === 'undefined') {
    return null;
  }
  const input = document.createElement('input');
  input.accept = ALLOWED_IMAGE_TYPES.join(',');
  input.type = 'file';
  return new Promise((resolve) => {
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}

export function validateLibraryImageFile(file: File): null | string {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'coach.library.media.errors.invalidImageType';
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'coach.library.media.errors.imageTooLarge';
  }
  return null;
}

export function isYouTubeUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'youtu.be') {
      return url.pathname.length > 1;
    }
    if (host !== 'youtube.com') {
      return false;
    }
    if (url.pathname === '/watch') {
      return Boolean(url.searchParams.get('v'));
    }
    if (url.pathname.startsWith('/embed/')) {
      return true;
    }
    if (url.pathname.startsWith('/shorts/')) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function normalizeYouTubeUrl(value: string): null | string {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed;
}

export function toYouTubeEmbedUrl(value: null | string): null | string {
  if (!value) {
    return null;
  }
  const videoId = readYouTubeVideoId(value);
  if (!videoId) {
    return null;
  }
  return `https://www.youtube.com/embed/${videoId}`;
}

function readYouTubeVideoId(raw: string): null | string {
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
