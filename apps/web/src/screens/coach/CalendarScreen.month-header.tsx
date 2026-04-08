import React, { useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { MONTH_NAMES_ES, DAY_NAMES_ES } from './calendar-screen.utils';
import type { CalendarClipboard } from './CalendarScreen.week-row';

type TFunc = (k: string, opts?: Record<string, unknown>) => string;

const colors = {
  primary: '#3b82f6',
  text: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
  bg: '#f8fafc',
};

function ClipboardBadge({
  clipboard,
  onClear,
  t,
}: {
  clipboard: CalendarClipboard | null;
  onClear: () => void;
  t: TFunc;
}): React.JSX.Element | null {
  if (!clipboard) return null;
  const label =
    clipboard.type === 'week' ? t('coach.calendar.clipboard.weekCopied') : t('coach.calendar.clipboard.dayCopied');
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: 8,
        padding: '4px 10px',
        fontSize: 12,
        color: colors.primary,
        fontWeight: 500,
      }}
    >
      <span>{label}</span>
      <div
        onClick={onClear}
        style={{ cursor: 'pointer', lineHeight: 0, marginLeft: 2 }}
        title={t('coach.calendar.clipboard.clear')}
      >
        <X size={12} color={colors.primary} />
      </div>
    </div>
  );
}

function MonthPicker({
  currentYear,
  currentMonth,
  anchorTop,
  anchorLeft,
  onGoTo,
  onClose,
}: {
  currentYear: number;
  currentMonth: number;
  anchorTop: number;
  anchorLeft: number;
  onGoTo: (year: number, month: number) => void;
  onClose: () => void;
}): React.JSX.Element {
  const [pickerYear, setPickerYear] = useState(currentYear);
  return ReactDOM.createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
      <div
        style={{
          position: 'fixed',
          top: anchorTop,
          left: anchorLeft,
          zIndex: 1000,
          backgroundColor: 'white',
          border: `1px solid ${colors.border}`,
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          padding: 16,
          minWidth: 240,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPickerYear((y) => y - 1);
            }}
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px 12px', fontSize: 18 }}
          >
            {'‹'}
          </button>
          <span style={{ fontWeight: 'bold', fontSize: 15, color: colors.text }}>{pickerYear}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPickerYear((y) => y + 1);
            }}
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px 12px', fontSize: 18 }}
          >
            {'›'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {MONTH_NAMES_ES.map((name, i) => {
            const isSelected = pickerYear === currentYear && i === currentMonth;
            return (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  onGoTo(pickerYear, i);
                  onClose();
                }}
                style={{
                  border: 'none',
                  borderRadius: 6,
                  padding: '7px 4px',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  backgroundColor: isSelected ? colors.primary : 'transparent',
                  color: isSelected ? 'white' : colors.text,
                }}
              >
                {name.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>
    </>,
    document.body,
  );
}

export type CalendarMonthHeaderProps = {
  year: number;
  month: number;
  clipboard: CalendarClipboard | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoTo: (year: number, month: number) => void;
  onClearClipboard: () => void;
  t: TFunc;
};

export function CalendarMonthHeader({
  year,
  month,
  clipboard,
  onPrevMonth,
  onNextMonth,
  onGoTo,
  onClearClipboard,
  t,
}: CalendarMonthHeaderProps): React.JSX.Element {
  const [showPicker, setShowPicker] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  function handleTitleClick() {
    if (titleRef.current) {
      const rect = titleRef.current.getBoundingClientRect();
      setAnchor({ top: rect.bottom + 4, left: rect.left });
    }
    setShowPicker((v) => !v);
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderColor: colors.border,
        flexShrink: 0,
      }}
    >
      <div ref={titleRef} onClick={handleTitleClick} style={{ cursor: 'pointer' }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>
          {MONTH_NAMES_ES[month]} {year}
        </Text>
      </div>
      {showPicker && anchor && (
        <MonthPicker
          currentYear={year}
          currentMonth={month}
          anchorTop={anchor.top}
          anchorLeft={anchor.left}
          onGoTo={onGoTo}
          onClose={() => setShowPicker(false)}
        />
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <ClipboardBadge clipboard={clipboard} onClear={onClearClipboard} t={t} />
        <Pressable
          onPress={onPrevMonth}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.bg,
          }}
        >
          <ChevronLeft color={colors.textMuted} size={16} />
        </Pressable>
        <Pressable
          onPress={onNextMonth}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.bg,
          }}
        >
          <ChevronRight color={colors.textMuted} size={16} />
        </Pressable>
      </View>
    </View>
  );
}

export function CalendarDayNames(): React.JSX.Element {
  return (
    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: colors.border, flexShrink: 0 }}>
      <View style={{ width: 20, flexShrink: 0 }} />
      {DAY_NAMES_ES.map((dayName) => (
        <View key={dayName} style={{ flex: 1, paddingVertical: 10, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.textMuted, letterSpacing: 0.5 }}>
            {dayName.slice(0, 3)}
          </Text>
        </View>
      ))}
    </View>
  );
}
