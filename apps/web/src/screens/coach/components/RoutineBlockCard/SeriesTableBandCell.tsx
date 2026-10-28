import React, { useEffect, useRef, useState } from 'react';
import { TextInput } from 'react-native';
import {
  formatHeartRateBand,
  parseHeartRateBand,
  sanitizeHeartRateBandInput,
  type HeartRateBand,
  type HeartRateBandKind,
} from '@trainerpro/shared';
import { colors } from '@trainerpro/ui';
import { st } from './SeriesTable.styles';
import { commitSeriesBand } from './seriesTableBand.utils';

const PLACEHOLDER_MUTED = colors.borderStrong;
const TEXT_KEYBOARD = 'default' as const;

interface SeriesTableBandCellProps {
  kind: HeartRateBandKind;
  max: number | null | undefined;
  min: number | null | undefined;
  placeholder: string;
  readOnly: boolean;
  onChange: (band: { max: number | null; min: number | null }) => void;
}

function bandFromProps(min: number | null | undefined, max: number | null | undefined): HeartRateBand {
  return { max: max ?? null, min: min ?? null };
}

export function SeriesTableBandCell({ kind, max, min, onChange, placeholder, readOnly }: SeriesTableBandCellProps) {
  const [rawText, setRawText] = useState(() => formatHeartRateBand(min, max));
  const focused = useRef(false);
  const started = useRef<HeartRateBand>(bandFromProps(min, max));
  const latest = useRef(rawText);

  useEffect(() => {
    if (focused.current) return;
    const band = bandFromProps(min, max);
    started.current = band;
    latest.current = formatHeartRateBand(band.min, band.max);
    setRawText(latest.current);
  }, [kind, max, min]);

  const publish = (band: HeartRateBand) => onChange({ max: band.max, min: band.min });

  const commit = () => {
    focused.current = false;
    const next = commitSeriesBand(latest.current, kind, started.current);
    latest.current = next.text;
    setRawText(next.text);
    publish(next);
  };

  return (
    <TextInput
      editable={!readOnly}
      keyboardType={TEXT_KEYBOARD}
      onBlur={commit}
      onChangeText={(text) => {
        const next = sanitizeHeartRateBandInput(text);
        latest.current = next;
        setRawText(next);
        publish(parseHeartRateBand(next, kind) ?? started.current);
      }}
      onFocus={() => {
        focused.current = true;
        started.current = bandFromProps(min, max);
      }}
      onSubmitEditing={commit}
      placeholder={placeholder}
      placeholderTextColor={PLACEHOLDER_MUTED}
      style={[st.cellInput, readOnly && st.cellInputReadOnly]}
      value={rawText}
    />
  );
}
