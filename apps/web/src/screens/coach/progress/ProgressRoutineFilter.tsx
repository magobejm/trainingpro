import { LoadingState } from '../../../components/AsyncStatus';
import { getLayoutStyle1 } from './ProgressRoutineFilter.layout-styles';
import { WebBox, WebText } from '@trainerpro/ui';
import { Button } from '@trainerpro/ui';
import { webShadow } from '@trainerpro/ui';
import React, { useEffect, useMemo, useState } from 'react';
import { usePerformedTemplatesQuery } from '../../../data/hooks/usePerformedTemplatesQuery';
import { usePerformedSessionDaysQuery } from '../../../data/hooks/usePerformedSessionDaysQuery';
import { useClientRoutineDaysQuery } from '../../../data/hooks/useCalendarQuery';
import type { SessionProgressCategory } from '../../../data/types/session-progress';
import type { PerformedSessionDay } from '../../../data/hooks/usePerformedSessionDaysQuery';
import { matchesSearch } from '../../../utils/normalize-search';
import { TextField, colors, fontSize, space } from '@trainerpro/ui';
type Props = {
  clientId: string | null;
  from: string;
  to: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  t: (k: string) => string;
  showDaySelector?: boolean;
  /** Microcycle: category tabs from all plan days (no day picker). */
  showCategorySelector?: boolean;
  selectedDayIndex?: number | null;
  onDaySelect?: (dayIndex: number | null) => void;
  selectedCategory?: SessionProgressCategory | null;
  onCategorySelect?: (cat: SessionProgressCategory | null) => void;
};
const CATEGORY_ORDER: SessionProgressCategory[] = ['strength', 'cardio', 'plio', 'isometric', 'mobility', 'sport'];
function categoryLabelKey(cat: SessionProgressCategory): string {
  return `coach.progress.filter.category.${cat}`;
}
/** Prefer snapshot title (already names the day); avoid "Día 1 — Día 2…" from prefix + mismatched title. */
function sessionDayChipLabel(
  d: {
    dayIndex: number;
    title: string;
  },
  dayPrefix: string,
): string {
  const title = d.title?.trim() ?? '';
  if (title.length > 0) return title;
  return `${dayPrefix} ${d.dayIndex}`;
}
function orderedCategoriesForDay(
  routineDays:
    | Array<{
        dayIndex: number;
        categories: SessionProgressCategory[];
      }>
    | undefined,
  selectedDayIndex: number | null,
): SessionProgressCategory[] {
  if (selectedDayIndex === null || selectedDayIndex === undefined) return [];
  const day = (routineDays ?? []).find((d) => d.dayIndex === selectedDayIndex);
  if (!day?.categories?.length) return [];
  return CATEGORY_ORDER.filter((c) => day.categories.includes(c));
}
function orderedCategoriesForPlan(
  routineDays:
    | Array<{
        dayIndex: number;
        categories: SessionProgressCategory[];
      }>
    | undefined,
): SessionProgressCategory[] {
  if (!routineDays?.length) return [];
  const set = new Set<SessionProgressCategory>();
  for (const d of routineDays) {
    for (const c of d.categories ?? []) set.add(c);
  }
  return CATEGORY_ORDER.filter((c) => set.has(c));
}
type SessionDayPickerProps = {
  t: (k: string) => string;
  isLoading: boolean;
  performedDays: PerformedSessionDay[];
  selectedDayIndex: number | null | undefined;
  onDaySelect?: (dayIndex: number | null) => void;
  onCategorySelect?: (cat: SessionProgressCategory | null) => void;
};
function SessionDayPicker({
  t,
  isLoading,
  performedDays,
  selectedDayIndex,
  onDaySelect,
  onCategorySelect,
}: SessionDayPickerProps) {
  return (
    <WebBox style={secondaryBlock}>
      <WebText style={secondaryLabel}>{t('coach.progress.filter.day.placeholder')}</WebText>
      {isLoading && <LoadingState label={t('coach.progress.loading')} variant="rows" />}
      {!isLoading && performedDays.length === 0 && (
        <WebText style={muted}>{t('coach.progress.filter.day.noPerformed')}</WebText>
      )}
      {performedDays.length > 0 && (
        <WebBox style={chipList}>
          {performedDays.map((d) => (
            <Button
              key={`${d.dayIndex}-${d.title}`}
              onPress={() => {
                if (selectedDayIndex === d.dayIndex) {
                  onDaySelect?.(null);
                  onCategorySelect?.(null);
                } else {
                  onDaySelect?.(d.dayIndex);
                }
              }}
              label={sessionDayChipLabel(d, t('coach.progress.filter.day.prefix'))}
              variant={selectedDayIndex === d.dayIndex ? 'primary' : 'secondary'}
              size="sm"
            />
          ))}
        </WebBox>
      )}
    </WebBox>
  );
}
type CategoryPickerProps = {
  t: (k: string) => string;
  categories: SessionProgressCategory[];
  selectedCategory: SessionProgressCategory | null | undefined;
  onCategorySelect?: (cat: SessionProgressCategory | null) => void;
};
function CategoryPicker({ t, categories, selectedCategory, onCategorySelect }: CategoryPickerProps) {
  if (categories.length === 0) return null;
  return (
    <WebBox style={secondaryBlock}>
      <WebText style={secondaryLabel}>{t('coach.progress.filter.category.label')}</WebText>
      <WebBox style={chipList}>
        {categories.map((cat) => (
          <Button
            key={cat}
            onPress={() => onCategorySelect?.(cat)}
            label={t(categoryLabelKey(cat))}
            variant={selectedCategory === cat ? 'primary' : 'secondary'}
            size="sm"
          />
        ))}
      </WebBox>
    </WebBox>
  );
}
/* Routine filter: template search plus optional session day + category (session progress mode). */
// eslint-disable-next-line max-lines-per-function -- single screen section; subcomponents handle day/category UI
export function ProgressRoutineFilter({
  clientId,
  from,
  to,
  selectedId,
  onSelect,
  t,
  showDaySelector = false,
  showCategorySelector = false,
  selectedDayIndex = null,
  onDaySelect,
  selectedCategory = null,
  onCategorySelect,
}: Props) {
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const performedQuery = usePerformedTemplatesQuery(
    { clientId: clientId ?? undefined, from, to },
    { enabled: Boolean(clientId) },
  );
  const performedDaysQuery = usePerformedSessionDaysQuery(
    { clientId: clientId ?? undefined, templateId: selectedId ?? '', from, to },
    { enabled: Boolean(clientId) && Boolean(selectedId) && showDaySelector },
  );
  const routineDaysQuery = useClientRoutineDaysQuery(showDaySelector || showCategorySelector ? selectedId : null);
  const allTemplates = performedQuery.data?.templates ?? [];
  const filtered = allTemplates.filter((r) => matchesSearch(r.name, search));
  const dropdownItems = filtered.slice(0, 10);
  const performedDays = [...(performedDaysQuery.data ?? [])].sort((a, b) => a.dayIndex - b.dayIndex);
  const categoriesForSelectedDay = useMemo(
    () => orderedCategoriesForDay(routineDaysQuery.data, selectedDayIndex ?? null),
    [routineDaysQuery.data, selectedDayIndex],
  );
  const categoriesForMicroPlan = useMemo(() => orderedCategoriesForPlan(routineDaysQuery.data), [routineDaysQuery.data]);
  useEffect(() => {
    if (!showDaySelector || !onCategorySelect) return;
    if (selectedDayIndex === null || selectedDayIndex === undefined) return;
    if (categoriesForSelectedDay.length === 0) return;
    if (selectedCategory === null || !categoriesForSelectedDay.includes(selectedCategory)) {
      onCategorySelect(categoriesForSelectedDay[0] ?? null);
    }
  }, [showDaySelector, onCategorySelect, selectedDayIndex, categoriesForSelectedDay, selectedCategory]);
  useEffect(() => {
    if (!showCategorySelector || !onCategorySelect) return;
    if (!selectedId) return;
    if (categoriesForMicroPlan.length === 0) return;
    if (selectedCategory === null || !categoriesForMicroPlan.includes(selectedCategory)) {
      onCategorySelect(categoriesForMicroPlan[0] ?? null);
    }
  }, [showCategorySelector, onCategorySelect, selectedId, categoriesForMicroPlan, selectedCategory]);
  function handleSelect(id: string, name: string) {
    onSelect(id);
    setSearch(name);
    setDropdownOpen(false);
  }
  function handleInputChange(value: string) {
    setSearch(value);
    setDropdownOpen(true);
    if (!value) onSelect(null);
  }
  const showSessionDayBlock = Boolean(showDaySelector && selectedId && clientId);
  const showCategoryBlock =
    Boolean(showDaySelector && selectedId) &&
    selectedDayIndex !== null &&
    selectedDayIndex !== undefined &&
    categoriesForSelectedDay.length > 0;
  const showMicroCategoryBlock =
    Boolean(showCategorySelector && selectedId && clientId) && categoriesForMicroPlan.length > 0;
  const layoutStyle1 = getLayoutStyle1;
  return (
    <WebBox style={filterBlock}>
      <WebBox style={layoutStyle1}>
        <TextField
          onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
          onChangeText={handleInputChange}
          onFocus={() => setDropdownOpen(true)}
          placeholder={t('coach.progress.filter.routine.placeholder')}
          value={search}
        />
        {dropdownOpen && (
          <WebBox style={dropdownContainer}>
            {dropdownItems.length > 0 ? (
              dropdownItems.map((item) => (
                <Button
                  key={item.id}
                  onPress={() => {
                    handleSelect(item.id, item.name);
                  }}
                  label={item.name}
                  variant={selectedId === item.id ? 'primary' : 'secondary'}
                  size="sm"
                />
              ))
            ) : (
              <WebText style={dropdownEmpty}>{t('coach.progress.filter.noResultsPeriod')}</WebText>
            )}
          </WebBox>
        )}
      </WebBox>

      {filtered.length > 0 && (
        <WebBox style={chipList}>
          {filtered.slice(0, 12).map((item) => (
            <Button
              key={item.id}
              onPress={() => {
                if (selectedId === item.id) {
                  onSelect(null);
                  setSearch('');
                } else {
                  handleSelect(item.id, item.name);
                }
              }}
              label={item.name}
              variant={selectedId === item.id ? 'primary' : 'secondary'}
              size="sm"
            />
          ))}
        </WebBox>
      )}

      {showSessionDayBlock && (
        <SessionDayPicker
          t={t}
          isLoading={performedDaysQuery.isLoading}
          performedDays={performedDays}
          selectedDayIndex={selectedDayIndex}
          onDaySelect={onDaySelect}
          onCategorySelect={onCategorySelect}
        />
      )}

      {showCategoryBlock && (
        <CategoryPicker
          t={t}
          categories={categoriesForSelectedDay}
          selectedCategory={selectedCategory}
          onCategorySelect={onCategorySelect}
        />
      )}

      {showMicroCategoryBlock && (
        <CategoryPicker
          t={t}
          categories={categoriesForMicroPlan}
          selectedCategory={selectedCategory}
          onCategorySelect={onCategorySelect}
        />
      )}

      {!clientId && <WebText style={noClientMsg}>{t('coach.progress.filter.noClient')}</WebText>}
    </WebBox>
  );
}
const filterBlock: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: space.md, width: '100%' };
const secondaryBlock: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: space.sm };
const secondaryLabel: React.CSSProperties = { margin: 0, fontSize: fontSize.xs, fontWeight: 800, color: colors.textMuted };
const muted: React.CSSProperties = { margin: 0, fontSize: fontSize.sm, color: colors.textMuted };
const dropdownContainer: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  right: 0,
  background: colors.surface,
  border: `1.5px solid ${colors.border}`,
  borderRadius: 16,
  boxShadow: webShadow.md,
  zIndex: 50,
  padding: '8px 4px',
  maxHeight: 320,
  overflowY: 'auto',
};

const dropdownEmpty: React.CSSProperties = {
  margin: '12px',
  fontSize: fontSize.sm,
  color: colors.textMuted,
  textAlign: 'center',
};
const chipList: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: space.sm };

const noClientMsg: React.CSSProperties = { margin: 0, fontSize: fontSize.sm, color: colors.textMuted };
