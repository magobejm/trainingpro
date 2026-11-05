import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { glossaryEntry, glossaryLocale, type SetVariableKey } from '@trainerpro/shared';
import { colors, fontSize, radius, shadow, space } from '@trainerpro/ui';

const CARD_WIDTH = 260;
type HintId = SetVariableKey | 'set';
type Box = { left: number; top: number };

/** Small card with the short glossary phrase. Portaled so a horizontal scroll cannot clip it. */
export function VariableHint(props: {
  children: React.ReactNode;
  id: HintId;
  style?: StyleProp<ViewStyle>;
}): React.JSX.Element {
  const { i18n } = useTranslation();
  const anchor = useRef<View>(null);
  const hovering = useRef(false);
  const [box, setBox] = useState<Box | null>(null);
  const entry = glossaryEntry(glossaryLocale(i18n.language), props.id);

  function show(): void {
    hovering.current = true;
    anchor.current?.measureInWindow((x, y, _width, height) => {
      if (!hovering.current || typeof window === 'undefined') return;
      const left = Math.max(8, Math.min(x, window.innerWidth - CARD_WIDTH - 8));
      setBox({ left, top: y + height + 6 });
    });
  }

  function hide(): void {
    hovering.current = false;
    setBox(null);
  }

  const hover = {
    onMouseEnter: show,
    onMouseLeave: hide,
  } as unknown as Partial<React.ComponentProps<typeof View>>;
  const card =
    box && entry && typeof document !== 'undefined' ? <HintCard entry={entry} left={box.left} top={box.top} /> : null;

  return (
    <View ref={anchor} style={[styles.anchor, props.style]} {...hover}>
      {props.children}
      {card ? createPortal(card, document.body) : null}
    </View>
  );
}

function HintCard(props: { entry: { short: string; term: string }; left: number; top: number }): React.JSX.Element {
  return (
    <div style={cardStyle(props.left, props.top)}>
      <span style={termStyle}>{props.entry.term}</span>
      <span style={shortStyle}>{props.entry.short}</span>
    </div>
  );
}

function cardStyle(left: number, top: number): React.CSSProperties {
  return {
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    boxShadow: `0 4px 12px rgba(15, 23, 42, ${shadow.md.shadowOpacity})`,
    display: 'flex',
    flexDirection: 'column',
    gap: space.xs,
    left,
    maxWidth: CARD_WIDTH,
    padding: space.sm,
    position: 'fixed',
    top,
    width: CARD_WIDTH,
    zIndex: 80,
  };
}

const termStyle: React.CSSProperties = { color: colors.text, fontSize: fontSize.sm, fontWeight: 700 };
const shortStyle: React.CSSProperties = { color: colors.textMuted, fontSize: fontSize.xs, lineHeight: '18px' };

const styles = StyleSheet.create({
  anchor: { cursor: 'help' } as unknown as ViewStyle,
});
