import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DateRange } from './progress-screen.types';

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
    if (from && to && from <= to) {
      onConfirm({ from, to });
      onClose();
    }
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
  background: '#fff',
  borderRadius: 20,
  padding: 32,
  width: 340,
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
  color: '#0f1b2f',
};

const fieldRow: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#5d6f85',
  textTransform: 'uppercase',
  letterSpacing: 1,
};

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1.5px solid #e2e8f0',
  fontSize: 14,
  color: '#0f1b2f',
  outline: 'none',
};

const buttons: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  justifyContent: 'flex-end',
};

const cancelBtn: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 10,
  border: '1.5px solid #e2e8f0',
  background: '#f8fafc',
  color: '#5d6f85',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: 13,
};

const confirmBtn: React.CSSProperties = {
  padding: '10px 18px',
  borderRadius: 10,
  border: 'none',
  background: '#3b82f6',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: 13,
};
