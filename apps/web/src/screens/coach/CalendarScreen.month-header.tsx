import React, { useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Text, View } from 'react-native';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { MONTH_NAMES_ES, DAY_NAMES_ES } from './calendar-screen.utils';
import type { CalendarClipboard } from './CalendarScreen.week-row';
import { IconButton, colors as tk, fontSize, radius, space } from '@trainerpro/ui';

type TFunc = (k: string, opts?: Record<string, unknown>) => string;

const colors = {
  primary: tk.primary,
  text: tk.text,
  textMuted: tk.textMuted,
  border: tk.border,
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
        gap: space.sm,
        backgroundColor: tk.primarySoft,
        border: `1px solid ${tk.primaryBorder}`,
        borderRadius: radius.md,
        padding: '4px 10px',
        fontSize: fontSize.xs,
        color: colors.primary,
        fontWeight: 500,
      }}
    >
      <span>{label}</span>
      <IconButton
        accessibilityLabel={t('coach.calendar.clipboard.clear')}
        icon={(color) => <X size={12} color={color} />}
        onPress={onClear}
        size={20}
      />
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
  t,
}: {
  currentYear: number;
  currentMonth: number;
  anchorTop: number;
  anchorLeft: number;
  onGoTo: (year: number, month: number) => void;
  onClose: () => void;
  t: TFunc;
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
          borderRadius: radius.md,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          padding: space.lg,
          minWidth: 240,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md }}>
          <IconButton
            accessibilityLabel={t('coach.calendar.header.prevYear')}
            icon={(color) => <ChevronLeft color={color} size={16} />}
            onPress={() => setPickerYear((y) => y - 1)}
            size={32}
          />
          <span style={{ fontWeight: 'bold', fontSize: fontSize.md, color: colors.text }}>{pickerYear}</span>
          <IconButton
            accessibilityLabel={t('coach.calendar.header.nextYear')}
            icon={(color) => <ChevronRight color={color} size={16} />}
            onPress={() => setPickerYear((y) => y + 1)}
            size={32}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: space.sm }}>
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
                  borderRadius: radius.sm,
                  padding: '7px 4px',
                  fontSize: fontSize.xs,
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
        padding: space.xl,
        borderBottomWidth: 1,
        borderColor: colors.border,
        flexShrink: 0,
      }}
    >
      <div ref={titleRef} onClick={handleTitleClick} style={{ cursor: 'pointer' }}>
        <Text style={{ fontSize: fontSize.xl, fontWeight: 'bold', color: colors.text }}>
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
          t={t}
        />
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <ClipboardBadge clipboard={clipboard} onClear={onClearClipboard} t={t} />
        <IconButton
          accessibilityLabel={t('coach.calendar.header.prevMonth')}
          icon={(color) => <ChevronLeft color={color} size={16} />}
          onPress={onPrevMonth}
          size={36}
        />
        <IconButton
          accessibilityLabel={t('coach.calendar.header.nextMonth')}
          icon={(color) => <ChevronRight color={color} size={16} />}
          onPress={onNextMonth}
          size={36}
        />
      </View>
    </View>
  );
}

export function CalendarDayNames(): React.JSX.Element {
  return (
    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: colors.border, flexShrink: 0 }}>
      <View style={{ width: 20, flexShrink: 0 }} />
      {DAY_NAMES_ES.map((dayName) => (
        <View key={dayName} style={{ flex: 1, paddingVertical: space.md, alignItems: 'center' }}>
          <Text style={{ fontSize: fontSize.xs, fontWeight: 'bold', color: colors.textMuted, letterSpacing: 0.5 }}>
            {dayName.slice(0, 3)}
          </Text>
        </View>
      ))}
    </View>
  );
}
