import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DateRange } from './progress-screen.types';
import { Button, Field, Modal, colors, fontSize, radius, space } from '@trainerpro/ui';

type Props = {
  visible: boolean;
  range: DateRange;
  onConfirm: (range: DateRange) => void;
  onClose: () => void;
};

const MAX_RANGE_DAYS = 400;

export function CalendarRangeModal({ visible, range, onConfirm, onClose }: Props): React.JSX.Element | null {
  const { t } = useTranslation();
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);
  const [submitted, setSubmitted] = useState(false);
  const dateType = 'date';

  if (!visible) return null;

  const inverted = Boolean(from && to && from > to);
  const tooLong = Boolean(from && to && from <= to && inclusiveDays(from, to) > MAX_RANGE_DAYS);
  const fromError = submitted && !from ? t('coach.progress.range.required') : null;
  const toError = tooLong
    ? t('coach.progress.range.tooLong')
    : inverted
      ? t('coach.progress.range.invalid')
      : submitted && !to
        ? t('coach.progress.range.required')
        : null;

  function handleConfirm() {
    setSubmitted(true);
    if (!from || !to || from > to) return;
    if (inclusiveDays(from, to) > MAX_RANGE_DAYS) return;
    onConfirm({ from, to });
    onClose();
  }

  return (
    <Modal
      closeLabel={t('common.close')}
      footer={
        <>
          <Button label={t('common.cancel')} onPress={onClose} variant="secondary" />
          <Button label={t('common.confirm')} onPress={handleConfirm} />
        </>
      }
      onClose={onClose}
      size="sm"
      title={t('coach.progress.range.custom')}
      visible={visible}
    >
      <div style={column}>
        <Field error={fromError} label={t('coach.progress.range.from')} required>
          <input
            aria-label={t('coach.progress.range.from')}
            type={dateType}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            max={to}
            style={inputStyle}
          />
        </Field>
        <Field error={toError} label={t('coach.progress.range.to')} required>
          <input
            aria-label={t('coach.progress.range.to')}
            type={dateType}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            min={from}
            style={inputStyle}
          />
        </Field>
      </div>
    </Modal>
  );
}

function inclusiveDays(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00.000Z`);
  const end = Date.parse(`${to}T00:00:00.000Z`);
  return Math.floor((end - start) / 86_400_000) + 1;
}

const column: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: space.lg,
};

const inputStyle: React.CSSProperties = {
  padding: `${space.sm}px ${space.md}px`,
  minHeight: 40,
  boxSizing: 'border-box',
  width: '100%',
  borderRadius: radius.md,
  border: `1px solid ${colors.border}`,
  fontFamily: 'inherit',
  fontSize: fontSize.sm,
  color: colors.text,
};
