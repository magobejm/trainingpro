import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ViewStyle } from 'react-native';
import { X, Check, ChevronRight } from 'lucide-react';
import { SelectOption, MODAL_THEME } from '../UnifiedExerciseModal.types';
import { colors, fontSize, radius, space } from '@trainerpro/ui';

const TAPS_HANDLED = 'handled' as const;
const BLUE_COLOR = colors.primaryHover;

interface MuscleMultiSelectProps {
  options: SelectOption[];
  selectedIds: string[];
  onToggle: (id: string, opts: SelectOption[]) => void;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  placeholder: string;
  closeLabel: string;
}

export function MuscleMultiSelect(props: MuscleMultiSelectProps) {
  const { options, selectedIds, onToggle, expanded, setExpanded, placeholder, closeLabel } = props;

  const selectedOptions = useMemo(() => {
    return options.filter((o) => selectedIds.includes(o.value));
  }, [options, selectedIds]);

  return (
    <View style={styles.multiSelectOuter}>
      <SelectHeader
        expanded={expanded}
        setExpanded={setExpanded}
        placeholder={placeholder}
        selectedOptions={selectedOptions}
        onToggle={onToggle}
        options={options}
      />
      {expanded && (
        <Dropdown
          options={options}
          selectedIds={selectedIds}
          onToggle={onToggle}
          onClose={() => setExpanded(false)}
          closeLabel={closeLabel}
        />
      )}
    </View>
  );
}

function SelectHeader(props: {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  placeholder: string;
  selectedOptions: SelectOption[];
  onToggle: (id: string, opts: SelectOption[]) => void;
  options: SelectOption[];
}) {
  const { expanded, setExpanded, placeholder, selectedOptions, onToggle, options } = props;
  return (
    <TouchableOpacity
      style={[styles.multiSelectHeader, expanded && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.multiSelectValueContainer}>
        {selectedOptions.length === 0 ? (
          <Text style={styles.multiSelectPlaceholder}>{placeholder}</Text>
        ) : (
          selectedOptions.map((opt) => (
            <SelectedTag key={opt.value} label={opt.label} onRemove={() => onToggle(opt.value, options)} />
          ))
        )}
      </View>
      <View style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}>
        <ChevronRight size={16} color={MODAL_THEME.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

function SelectedTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        style={styles.tagRemove}
      >
        <X size={12} color={BLUE_COLOR} strokeWidth={3} />
      </TouchableOpacity>
    </View>
  );
}

function Dropdown(props: {
  options: SelectOption[];
  selectedIds: string[];
  onToggle: (id: string, opts: SelectOption[]) => void;
  onClose: () => void;
  closeLabel: string;
}) {
  const { options, selectedIds, onToggle, onClose, closeLabel } = props;
  return (
    <View style={styles.multiSelectDropdown}>
      <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled keyboardShouldPersistTaps={TAPS_HANDLED}>
        {options.map((opt) => {
          const isSelected = selectedIds.includes(opt.value);
          return (
            <TouchableOpacity key={opt.value} style={styles.multiSelectItem} onPress={() => onToggle(opt.value, options)}>
              <Text style={[styles.multiSelectItemText, isSelected && styles.multiSelectItemActive]}>{opt.label}</Text>
              {isSelected && <Check size={14} color={MODAL_THEME.colors.primary} />}
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity style={styles.multiSelectCloseButton} onPress={onClose}>
          <Text style={styles.multiSelectCloseText}>{closeLabel}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  multiSelectOuter: {
    zIndex: 50,
    position: 'relative',
  },
  multiSelectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: space.md,
    paddingVertical: space.md,
    minHeight: 44,
    borderWidth: 1,
    borderColor: MODAL_THEME.colors.border,
    borderRadius: MODAL_THEME.borderRadius.md,
    backgroundColor: MODAL_THEME.colors.surface,
  },
  multiSelectValueContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  multiSelectPlaceholder: {
    fontSize: fontSize.sm,
    color: MODAL_THEME.colors.textSecondary,
    paddingVertical: 2,
  },
  tag: {
    backgroundColor: colors.primaryBorder,
    borderRadius: radius.sm,
    paddingLeft: space.sm,
    paddingRight: space.xs,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: space.sm,
    marginVertical: 2,
  },
  tagText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.primaryHover,
  },
  tagRemove: {
    marginLeft: space.xs,
    padding: 2,
  },
  multiSelectDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: MODAL_THEME.colors.border,
    borderBottomLeftRadius: MODAL_THEME.borderRadius.md,
    borderBottomRightRadius: MODAL_THEME.borderRadius.md,
    zIndex: 1000,
    boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
    maxHeight: 250,
  } as ViewStyle,
  multiSelectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  multiSelectItemText: {
    fontSize: fontSize.sm,
    color: MODAL_THEME.colors.text,
  },
  multiSelectItemActive: {
    color: MODAL_THEME.colors.primary,
    fontWeight: '800',
  },
  multiSelectCloseButton: {
    padding: space.md,
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  multiSelectCloseText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: MODAL_THEME.colors.textSecondary,
  },
});
