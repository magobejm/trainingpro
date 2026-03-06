import React from 'react';

export type ProgressPhoto = {
  archived?: boolean;
  createdAt: string;
  id: string;
  imagePath?: string;
  imageUrl: string;
};

export const ICON_PLUS = '＋';
export const ICON_PENCIL = '✎';
export const ICON_MAGNIFIER = '🔍';
export const ICON_ARCHIVE = '✉';
export const ICON_CLOSE = '×';
export const ICON_PREV = '‹';
export const ICON_NEXT = '›';
export const ICON_NOTE = '📝';
export const ICON_INJURY = '🩹';
export const ICON_ALERT = '⚠️';
export const ICON_IDEA = '💡';

export const buttonType = 'button';
export const dateInputType = 'date';
export const emptyAlt = '';

export function resolvePhotoUrl(imageUrl: string, imagePath?: string): string {
  const candidate = imageUrl || imagePath || '';
  if (!candidate) return '';
  if (candidate.startsWith('http://') || candidate.startsWith('https://')) return candidate;
  return `${resolveApiBaseUrl()}/uploads/${candidate.replace(/^\/+/, '')}`;
}

function resolveApiBaseUrl(): string {
  const scope = globalThis as {
    process?: { env?: Record<string, string | undefined> };
  };
  const processEnv = scope.process?.env ?? {};
  const metaEnv =
    (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
  return (
    metaEnv.EXPO_PUBLIC_API_BASE_URL ??
    processEnv.EXPO_PUBLIC_API_BASE_URL ??
    'http://localhost:8080'
  );
}

export function calculateAge(birthDate: string): null | number {
  if (!birthDate) return null;
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

export function formatDateDisplay(dateIso: string, locale: string, fallback: string): string {
  if (!dateIso) return fallback;
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
}

export function formatMonthYear(dateIso: string, locale: string, fallback: string): string {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

export function daysSince(dateIso: string): number {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return 0;
  const diffMs = Date.now() - date.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function formatPhotoDate(dateIso: string, locale: string, fallback: string): string {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(locale);
}

export function scrollRail(node: HTMLDivElement | null, amount: number): void {
  if (!node) return;
  node.scrollBy({ behavior: 'smooth', left: amount });
}

export const envelopeStyle: React.CSSProperties = {
  alignItems: 'center',
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: 10,
  color: '#1d4ed8',
  cursor: 'pointer',
  display: 'flex',
  fontSize: 12,
  fontWeight: 700,
  justifyContent: 'center',
  minHeight: 36,
  minWidth: 140,
  padding: '0 12px',
};

export const draggablePhotoStyle: React.CSSProperties = {
  cursor: 'grab',
  flex: '0 0 auto',
};

export const dateInputStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #1c74e9',
  borderRadius: 8,
  boxSizing: 'border-box',
  color: '#0f172a',
  display: 'block',
  fontSize: 12,
  marginTop: 6,
  minHeight: 34,
  minWidth: 220,
  padding: '6px 8px',
  width: '100%',
};

export const galleryBackdropStyle: React.CSSProperties = {
  alignItems: 'center',
  backdropFilter: 'blur(6px)',
  background: 'rgba(9, 16, 28, 0.74)',
  bottom: 0,
  display: 'flex',
  justifyContent: 'center',
  left: 0,
  position: 'fixed',
  right: 0,
  top: 0,
  zIndex: 120,
};

export const galleryContainerStyle: React.CSSProperties = {
  background: '#020617',
  borderRadius: 16,
  boxShadow: '0 24px 70px rgba(0,0,0,0.5)',
  maxWidth: 'min(92vw, 980px)',
  padding: 16,
  width: '92vw',
};

export const galleryTopRowStyle: React.CSSProperties = {
  alignItems: 'center',
  color: '#e2e8f0',
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 10,
};

export const galleryCounterStyle: React.CSSProperties = {
  color: '#e2e8f0',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1,
};

export const galleryCloseStyle: React.CSSProperties = {
  background: 'transparent',
  border: 0,
  color: '#f8fafc',
  cursor: 'pointer',
  fontSize: 24,
  height: 30,
  lineHeight: '30px',
  width: 30,
};

export const galleryBodyStyle: React.CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  gap: 10,
  justifyContent: 'space-between',
};

export const galleryNavStyle: React.CSSProperties = {
  background: 'transparent',
  border: 0,
  color: '#94a3b8',
  cursor: 'pointer',
  fontSize: 34,
  fontWeight: 300,
  minWidth: 40,
};

export const galleryImageStyle: React.CSSProperties = {
  borderRadius: 10,
  height: 'auto',
  maxHeight: '72vh',
  maxWidth: '100%',
  objectFit: 'contain',
};

export const photoThumbImageStyle: React.CSSProperties = {
  borderRadius: 8,
  display: 'block',
  height: 120,
  objectFit: 'cover',
  transition: 'filter 0.2s ease, transform 0.2s ease',
  width: '100%',
};

export const photoThumbImageHoverStyle: React.CSSProperties = {
  filter: 'blur(1.6px) brightness(0.72)',
  transform: 'scale(1.04)',
};

export const headerAvatarStyle: React.CSSProperties = {
  borderRadius: 40,
  display: 'block',
  height: 180,
  objectFit: 'contain',
  position: 'relative',
  transition: 'filter 0.2s ease',
  width: 180,
  zIndex: 2,
};

export const headerAvatarHoverStyle: React.CSSProperties = {
  filter: 'blur(1.8px) brightness(0.72)',
};

export const headerAvatarBackgroundStyle: React.CSSProperties = {
  borderRadius: 40,
  filter: 'blur(12px) brightness(0.75)',
  height: '100%',
  left: 0,
  objectFit: 'cover',
  opacity: 0.9,
  position: 'absolute',
  top: 0,
  width: '100%',
  zIndex: 1,
};

export const carouselWrapStyle: React.CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  gap: 8,
};

export const carouselRailStyle: React.CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  gap: 8,
  overflowX: 'auto',
  paddingBottom: 4,
  scrollbarWidth: 'thin',
  width: '100%',
};

export const carouselArrowStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #d1dbe8',
  borderRadius: 999,
  color: '#1e3a8a',
  cursor: 'pointer',
  fontSize: 22,
  height: 32,
  lineHeight: '28px',
  minWidth: 32,
};

export function avatarHoverStyle(hovered: boolean): React.CSSProperties {
  return {
    ...headerAvatarStyle,
    ...(hovered ? headerAvatarHoverStyle : {}),
  };
}
