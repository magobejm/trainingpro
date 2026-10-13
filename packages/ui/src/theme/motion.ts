import { useEffect, useState } from 'react';

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

type MotionMedia = {
  matches: boolean;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
};

type MatchMedia = (query: string) => MotionMedia;

/** Sin `matchMedia` (Jest o nativo) no hay preferencia que leer y el movimiento sigue activo. */
export function matchReducedMotion(matchMediaFn: MatchMedia | undefined): boolean {
  if (typeof matchMediaFn !== 'function') return false;
  try {
    return matchMediaFn(REDUCED_MOTION_QUERY).matches === true;
  } catch {
    return false;
  }
}

function environmentMatchMedia(): MatchMedia | undefined {
  if (typeof globalThis.matchMedia !== 'function') return undefined;
  return (query) => globalThis.matchMedia(query);
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => matchReducedMotion(environmentMatchMedia()));
  useEffect(() => {
    const matchMediaFn = environmentMatchMedia();
    if (!matchMediaFn) return undefined;
    const media = matchMediaFn(REDUCED_MOTION_QUERY);
    const onChange = () => setReduced(media.matches === true);
    media.addEventListener?.('change', onChange);
    setReduced(media.matches === true);
    return () => media.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

export function easedCount(target: number, progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  const eased = 1 - (1 - clamped) ** 3;
  return target * eased;
}

/** Con movimiento reducido devuelve el valor final, sin animación. */
export function useCountUp(value: number, durationMs = 700): number {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);
  useEffect(() => {
    if (reduced || durationMs <= 0) {
      setShown(value);
      return undefined;
    }
    let frame = 0;
    const start = globalThis.performance?.now?.() ?? Date.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      setShown(easedCount(value, progress));
      if (progress < 1) frame = globalThis.requestAnimationFrame(tick);
    };
    frame = globalThis.requestAnimationFrame(tick);
    return () => globalThis.cancelAnimationFrame(frame);
  }, [durationMs, reduced, value]);
  return shown;
}
