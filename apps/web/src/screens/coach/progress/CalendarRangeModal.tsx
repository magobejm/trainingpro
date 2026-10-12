import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DateRange } from './progress-screen.types';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

type Props = {
  visible: boolean;
  range: DateRange;
  onConfirm: (range: DateRange) => void;
  onClose: () => void;
};

export function CalendarRangeModal({ visible, range, onConfirm, onClose }: Props): React.JSX.Element | null {
  const { t } = useTranslation();
  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);
  const dateType = 'date';

  if (!visible) return null;

  function handleConfirm() {
    if (!from || !to || from > to) return;
    if (inclusiveDays(from, to) > 400) return;
    onConfirm({ from, to });
    onClose();
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={titleStyle}>{t('coach.progress.range.custom')}</h3>
        <div style={fieldRow}>
          <label style={labelStyle}>{t('coach.progress.range.from')}</label>
          <input type={dateType} value={from} onChange={(e) => setFrom(e.target.value)} max={to} style={inputStyle} />
        </div>
        <div style={fieldRow}>
          <label style={labelStyle}>{t('coach.progress.range.to')}</label>
          <input type={dateType} value={to} onChange={(e) => setTo(e.target.value)} min={from} style={inputStyle} />
        </div>
        {from && to && from <= to && inclusiveDays(from, to) > 400 ? (
          <p style={hintStyle}>{t('coach.progress.range.tooLong')}</p>
        ) : null}
        <div style={buttons}>
          <button style={cancelBtn} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button style={confirmBtn} onClick={handleConfirm}>
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 200,
  background: 'rgba(15,27,47,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modal: React.CSSProperties = {
  background: colors.surface,
  borderRadius: 20,
  padding: space.xxl,
  width: 340,
  display: 'flex',
  flexDirection: 'column',
  gap: space.xl,
  boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
};

function inclusiveDays(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00.000Z`);
  const end = Date.parse(`${to}T00:00:00.000Z`);
  return Math.floor((end - start) / 86_400_000) + 1;
}

const hintStyle: React.CSSProperties = { margin: 0, color: colors.danger, fontSize: fontSize.sm };

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: fontSize.lg,
  fontWeight: 800,
  color: colors.text,
};

const fieldRow: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: space.sm,
};

const labelStyle: React.CSSProperties = {
  fontSize: fontSize.xs,
  fontWeight: 700,
  color: colors.textMuted,
  textTransform: 'uppercase',
  letterSpacing: 1,
};

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: radius.md,
  border: `1.5px solid ${colors.border}`,
  fontSize: fontSize.sm,
  color: colors.text,
  outline: 'none',
};

const buttons: React.CSSProperties = {
  display: 'flex',
  gap: space.md,
  justifyContent: 'flex-end',
};

const cancelBtn: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: radius.md,
  border: `1.5px solid ${colors.border}`,
  background: colors.surfaceMuted,
  color: colors.textMuted,
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: fontSize.sm,
};

const confirmBtn: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: radius.md,
  border: 'none',
  background: colors.primary,
  color: colors.surface,
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: fontSize.sm,
};
