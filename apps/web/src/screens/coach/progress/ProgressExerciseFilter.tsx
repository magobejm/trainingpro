import React, { useEffect, useRef, useState } from 'react';
import {
  useLibraryCardioMethodsQuery,
  useLibraryExercisesQuery,
  useLibraryIsometricExercisesQuery,
  useLibraryMobilityExercisesQuery,
  useLibraryPlioExercisesQuery,
  useLibrarySportsQuery,
} from '../../../data/hooks/useLibraryQuery';
import { usePerformedExercisesQuery } from '../../../data/hooks/usePerformedExercisesQuery';
import type { ExerciseType, SelectedExercise } from './progress-screen.types';

type Group = {
  type: ExerciseType;
  labelKey: string;
  items: Array<{ id: string; name: string }>;
};

type Props = {
  clientId: string | null;
  from: string;
  to: string;
  selected: SelectedExercise | null;
  onSelect: (ex: SelectedExercise | null) => void;
  t: (k: string) => string;
};

// eslint-disable-next-line max-lines-per-function
export function ProgressExerciseFilter({ clientId, from, to, selected, onSelect, t }: Props) {
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const exercisesQuery = useLibraryExercisesQuery({ query: search });
  const cardioQuery = useLibraryCardioMethodsQuery({ query: search });
  const plioQuery = useLibraryPlioExercisesQuery({ query: search });
  const mobilityQuery = useLibraryMobilityExercisesQuery({ query: search });
  const isometricQuery = useLibraryIsometricExercisesQuery({ query: search });
  const sportsQuery = useLibrarySportsQuery();

  const performedQuery = usePerformedExercisesQuery(
    { clientId: clientId ?? undefined, from, to },
    { enabled: Boolean(clientId) },
  );

  const performed = performedQuery.data ?? {
    strength: [],
    cardio: [],
    plio: [],
    mobility: [],
    isometric: [],
    sport: [],
  };

  const performedIds = {
    strength: new Set(performed.strength.map((e) => e.id)),
    cardio: new Set(performed.cardio.map((e) => e.id)),
    plio: new Set(performed.plio.map((e) => e.id)),
    mobility: new Set(performed.mobility.map((e) => e.id)),
    isometric: new Set(performed.isometric.map((e) => e.id)),
    sport: new Set(performed.sport.map((e) => e.id)),
  };

  useEffect(() => {
    if (selected) setSearch(selected.name);
  }, [selected]);

  const q = search.toLowerCase();

  function filterBySearch<T extends { id: string; name: string }>(items: T[]): T[] {
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }

  /** Orden: Grupo muscular, Cardio, Pliometría, Isométrico, Movilidad, Deporte */
  const groups: Group[] = [
    {
      type: 'strength',
      labelKey: 'coach.progress.filter.group.strength',
      items: filterBySearch(exercisesQuery.data ?? []).filter((e) => performedIds.strength.has(e.id)),
    },
    {
      type: 'cardio',
      labelKey: 'coach.progress.filter.group.cardio',
      items: filterBySearch(cardioQuery.data ?? []).filter((e) => performedIds.cardio.has(e.id)),
    },
    {
      type: 'plio',
      labelKey: 'coach.progress.filter.group.plio',
      items: filterBySearch(plioQuery.data ?? []).filter((e) => performedIds.plio.has(e.id)),
    },
    {
      type: 'isometric',
      labelKey: 'coach.progress.filter.group.isometric',
      items: filterBySearch(isometricQuery.data ?? []).filter((e) => performedIds.isometric.has(e.id)),
    },
    {
      type: 'mobility',
      labelKey: 'coach.progress.filter.group.mobility',
      items: filterBySearch(mobilityQuery.data ?? []).filter((e) => performedIds.mobility.has(e.id)),
    },
    {
      type: 'sport',
      labelKey: 'coach.progress.filter.group.sport',
      items: filterBySearch(sportsQuery.data ?? []).filter((e) => performedIds.sport.has(e.id)),
    },
  ];

  const dropdownGroups = groups.filter((g) => g.items.length > 0);
  const hasDropdownResults = dropdownGroups.length > 0;

  function handleSelect(item: { id: string; name: string }, type: ExerciseType) {
    onSelect({ id: item.id, type, name: item.name });
    setSearch(item.name);
    setDropdownOpen(false);
  }

  function handleInputChange(value: string) {
    setSearch(value);
    setDropdownOpen(true);
    if (!value) onSelect(null);
  }

  return (
    <div style={filterBlock}>
      <div style={{ position: 'relative' }}>
        <div style={searchIconWrap} />
        <input
          ref={inputRef}
          style={searchInput}
          placeholder={t('coach.progress.filter.exercise.placeholder')}
          value={search}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setDropdownOpen(true)}
          onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
        />
        {dropdownOpen && (
          <div style={dropdownContainer}>
            {hasDropdownResults ? (
              dropdownGroups.map((group) => (
                <div key={group.type}>
                  <p style={dropdownGroupLabel}>{t(group.labelKey)}</p>
                  {group.items.slice(0, 8).map((item) => (
                    <button
                      key={item.id}
                      style={{ ...dropdownItem, ...(selected?.id === item.id ? dropdownItemActive : {}) }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(item, group.type);
                      }}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              ))
            ) : (
              <p style={dropdownEmpty}>{t('coach.progress.filter.noResultsPeriod')}</p>
            )}
          </div>
        )}
      </div>

      {selected ? (
        <div style={selectedExerciseRow}>
          <span style={selectedExerciseName}>{selected.name}</span>
          <button
            type={'button'}
            style={selectedClearBtn}
            aria-label={t('common.close')}
            onClick={() => {
              onSelect(null);
              setSearch('');
            }}
          >
            {t('common.modalCloseGlyph')}
          </button>
        </div>
      ) : null}

      {!clientId && <p style={noClientMsg}>{t('coach.progress.filter.noClient')}</p>}
    </div>
  );
}

const filterBlock: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12, width: '100%' };
const searchIconWrap: React.CSSProperties = {
  position: 'absolute',
  left: 14,
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
};
const searchInput: React.CSSProperties = {
  padding: '10px 14px 10px 40px',
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
const dropdownGroupLabel: React.CSSProperties = {
  margin: '8px 12px 2px',
  fontSize: 10,
  fontWeight: 800,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: 1,
};
const dropdownItem: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
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
const selectedExerciseRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 14px',
  borderRadius: 12,
  border: '1.5px solid #dce3eb',
  background: '#fff',
  maxWidth: '100%',
};
const selectedExerciseName: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  fontSize: 14,
  fontWeight: 700,
  color: '#0f1b2f',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
const selectedClearBtn: React.CSSProperties = {
  flexShrink: 0,
  width: 32,
  height: 32,
  borderRadius: 8,
  border: '1.5px solid #dce3eb',
  background: '#f8fafc',
  color: '#64748b',
  fontSize: 16,
  lineHeight: 1,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
const noClientMsg: React.CSSProperties = { margin: 0, fontSize: 13, color: '#94a3b8' };
