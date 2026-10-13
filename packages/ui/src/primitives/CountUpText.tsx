import React from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useCountUp } from '../theme/motion';

type Parts = { amount: number; decimals: number; suffix: string };

export function splitLeadingNumber(value: string): Parts | null {
  const match = /^(-?\d+(?:[.,]\d+)?)(.*)$/.exec(value.trim());
  if (!match) return null;
  const raw = match[1] ?? '';
  const amount = Number(raw.replace(',', '.'));
  if (!Number.isFinite(amount)) return null;
  const fraction = raw.split(/[.,]/)[1];
  return { amount, decimals: fraction?.length ?? 0, suffix: match[2] ?? '' };
}

export function formatCount(amount: number, decimals: number, suffix: string): string {
  const shown = decimals === 0 ? String(Math.round(amount)) : amount.toFixed(decimals);
  return `${shown}${suffix}`;
}

export function CountUpText(props: { style?: StyleProp<TextStyle>; value: string }): React.JSX.Element {
  const parts = splitLeadingNumber(props.value);
  const animated = useCountUp(parts?.amount ?? 0);
  const text = parts ? formatCount(animated, parts.decimals, parts.suffix) : props.value;
  return <Text style={props.style}>{text}</Text>;
}
