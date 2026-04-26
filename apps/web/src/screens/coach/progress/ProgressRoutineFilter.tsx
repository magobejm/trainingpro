import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePerformedTemplatesQuery } from '../../../data/hooks/usePerformedTemplatesQuery';
import { usePerformedSessionDaysQuery } from '../../../data/hooks/usePerformedSessionDaysQuery';
import { useClientRoutineDaysQuery } from '../../../data/hooks/useCalendarQuery';
import type { SessionProgressCategory } from '../../../data/types/session-progress';
import type { PerformedSessionDay } from '../../../data/hooks/usePerformedSessionDaysQuery';

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
function sessionDayChipLabel(d: { dayIndex: number; title: string }, dayPrefix: string): string {
  const title = d.title?.trim() ?? '';
  if (title.length > 0) return title;
  return `${dayPrefix} ${d.dayIndex}`;
}

function orderedCategoriesForDay(
  routineDays: Array<{ dayIndex: number; categories: SessionProgressCategory[] }> | undefined,
  selectedDayIndex: number | null,
): SessionProgressCategory[] {
  if (selectedDayIndex === null || selectedDayIndex === undefined) return [];
  const day = (routineDays ?? []).find((d) => d.dayIndex === selectedDayIndex);
  if (!day?.categories?.length) return [];
  return CATEGORY_ORDER.filter((c) => day.categories.includes(c));
}

function orderedCategoriesForPlan(
  routineDays: Array<{ dayIndex: number; categories: SessionProgressCategory[] }> | undefined,
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
    <div style={secondaryBlock}>
      <p style={secondaryLabel}>{t('coach.progress.filter.day.placeholder')}</p>
      {isLoading && <p style={muted}>{t('coach.progress.loading')}</p>}
      {!isLoading && performedDays.length === 0 && <p style={muted}>{t('coach.progress.filter.day.noPerformed')}</p>}
      {performedDays.length > 0 && (
        <div style={chipList}>
          {performedDays.map((d) => (
            <button
              key={`${d.dayIndex}-${d.title}`}
              style={{ ...chip, ...(selectedDayIndex === d.dayIndex ? chipActive : {}) }}
              onClick={() => {
                if (selectedDayIndex === d.dayIndex) {
                  onDaySelect?.(null);
                  onCategorySelect?.(null);
                } else {
                  onDaySelect?.(d.dayIndex);
                }
              }}
            >
              {sessionDayChipLabel(d, t('coach.progress.filter.day.prefix'))}
            </button>
          ))}
        </div>
      )}
    </div>
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
    <div style={secondaryBlock}>
      <p style={secondaryLabel}>{t('coach.progress.filter.category.label')}</p>
      <div style={chipList}>
        {categories.map((cat) => (
          <button
            key={cat}
            style={{ ...chip, ...(selectedCategory === cat ? chipActive : {}) }}
            onClick={() => onCategorySelect?.(cat)}
          >
            {t(categoryLabelKey(cat))}
          </button>
        ))}
      </div>
    </div>
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
  const inputRef = useRef<HTMLInputElement>(null);

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
  const q = search.toLowerCase();
  const filtered = allTemplates.filter((r) => r.name.toLowerCase().includes(q));
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

  return (
    <div style={filterBlock}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          style={searchInput}
          placeholder={t('coach.progress.filter.routine.placeholder')}
          value={search}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setDropdownOpen(true)}
          onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
        />
        {dropdownOpen && (
          <div style={dropdownContainer}>
            {dropdownItems.length > 0 ? (
              dropdownItems.map((item) => (
                <button
                  key={item.id}
                  style={{ ...dropdownItem, ...(selectedId === item.id ? dropdownItemActive : {}) }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(item.id, item.name);
                  }}
                >
                  {item.name}
                </button>
              ))
            ) : (
              <p style={dropdownEmpty}>{t('coach.progress.filter.noResultsPeriod')}</p>
            )}
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div style={chipList}>
          {filtered.slice(0, 12).map((item) => (
            <button
              key={item.id}
              style={{ ...chip, ...(selectedId === item.id ? chipActive : {}) }}
              onClick={() => {
                if (selectedId === item.id) {
                  onSelect(null);
                  setSearch('');
                } else {
                  handleSelect(item.id, item.name);
                }
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
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

      {!clientId && <p style={noClientMsg}>{t('coach.progress.filter.noClient')}</p>}
    </div>
  );
}

const filterBlock: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12, width: '100%' };
const secondaryBlock: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 };
const secondaryLabel: React.CSSProperties = { margin: 0, fontSize: 12, fontWeight: 800, color: '#64748b' };
const muted: React.CSSProperties = { margin: 0, fontSize: 13, color: '#94a3b8' };
const searchInput: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: '1.5px solid #dce3eb',
  fontSize: 14,
  color: '#0f1b2f',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};
const dropdownContainer: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  right: 0,
  background: '#fff',
  border: '1.5px solid #dce3eb',
  borderRadius: 16,
  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
  zIndex: 50,
  padding: '8px 4px',
  maxHeight: 320,
  overflowY: 'auto',
};
const dropdownItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '9px 14px',
  border: 'none',
  background: 'transparent',
  color: '#334155',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  borderRadius: 10,
  textAlign: 'left',
};
const dropdownItemActive: React.CSSProperties = { background: '#eff6ff', color: '#3b82f6' };
const dropdownEmpty: React.CSSProperties = { margin: '12px', fontSize: 13, color: '#94a3b8', textAlign: 'center' };
const chipList: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 };
const chip: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 10,
  border: '1.5px solid #dce3eb',
  background: '#fff',
  color: '#5d6f85',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: 13,
};
const chipActive: React.CSSProperties = { background: '#0f1b2f', color: '#fff', borderColor: '#0f1b2f' };
const noClientMsg: React.CSSProperties = { margin: 0, fontSize: 13, color: '#94a3b8' };
