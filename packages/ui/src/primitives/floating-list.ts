/** react-native-web draws Modal at 9999. A list below that paints behind the dialog. */
export const FLOATING_LIST_Z = 10001;

const PREFERRED_MAX = 280;
const GAP = 4;
const VIEWPORT_PAD = 8;
const FLIP_BELOW = 160;

export type FloatingBox = {
  bottom?: number;
  left: number;
  maxHeight: number;
  top?: number;
  width: number;
};

/** Opens downward, or upward when the field sits too close to the bottom of the viewport. */
export function placeFloatingList(rect: Pick<DOMRect, 'bottom' | 'left' | 'top' | 'width'>): FloatingBox {
  const spaceBelow = window.innerHeight - rect.bottom - GAP - VIEWPORT_PAD;
  const spaceAbove = rect.top - GAP - VIEWPORT_PAD;
  const openUp = spaceBelow < FLIP_BELOW && spaceAbove > spaceBelow;
  const maxHeight = Math.max(GAP * 20, Math.min(PREFERRED_MAX, openUp ? spaceAbove : spaceBelow));
  if (openUp) {
    return { bottom: window.innerHeight - rect.top + GAP, left: rect.left, maxHeight, width: rect.width };
  }
  return { left: rect.left, maxHeight, top: rect.bottom + GAP, width: rect.width };
}
