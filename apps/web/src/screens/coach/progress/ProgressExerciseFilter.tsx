import React, { useEffect, useState } from 'react';
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
import { matchesSearch } from '../../../utils/normalize-search';
import { IconButton, TextField, colors, fontSize, radius, space } from '@trainerpro/ui';

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

  function filterBySearch<T extends { id: string; name: string }>(items: T[]): T[] {
    return items.filter((i) => matchesSearch(i.name, search));
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
        <TextField
          onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
          onChangeText={handleInputChange}
          onFocus={() => setDropdownOpen(true)}
          placeholder={t('coach.progress.filter.exercise.placeholder')}
          value={search}
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
          <IconButton
            accessibilityLabel={t('common.close')}
            icon={(color) => (
              <span style={{ color, fontSize: fontSize.md, lineHeight: 1 }}>{t('common.modalCloseGlyph')}</span>
            )}
            onPress={() => {
              onSelect(null);
              setSearch('');
            }}
            size={32}
          />
        </div>
      ) : null}

      {!clientId && <p style={noClientMsg}>{t('coach.progress.filter.noClient')}</p>}
    </div>
  );
}

const filterBlock: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: space.md, width: '100%' };
const dropdownContainer: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  right: 0,
  background: colors.surface,
  border: `1.5px solid ${colors.border}`,
  borderRadius: 16,
  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
  zIndex: 50,
  padding: '8px 4px',
  maxHeight: 320,
  overflowY: 'auto',
};
const dropdownGroupLabel: React.CSSProperties = {
  margin: '8px 12px 2px',
  fontSize: fontSize.xs,
  fontWeight: 800,
  color: colors.textMuted,
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
  color: colors.text,
  fontWeight: 600,
  fontSize: fontSize.sm,
  cursor: 'pointer',
  borderRadius: radius.md,
  textAlign: 'left',
};
const dropdownItemActive: React.CSSProperties = { background: colors.primarySoft, color: colors.primary };
const dropdownEmpty: React.CSSProperties = {
  margin: '12px',
  fontSize: fontSize.sm,
  color: colors.textMuted,
  textAlign: 'center',
};
const selectedExerciseRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: space.md,
  padding: '10px 14px',
  borderRadius: radius.lg,
  border: `1.5px solid ${colors.border}`,
  background: colors.surface,
  maxWidth: '100%',
};
const selectedExerciseName: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  fontSize: fontSize.sm,
  fontWeight: 700,
  color: colors.text,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
const noClientMsg: React.CSSProperties = { margin: 0, fontSize: fontSize.sm, color: colors.textMuted };
