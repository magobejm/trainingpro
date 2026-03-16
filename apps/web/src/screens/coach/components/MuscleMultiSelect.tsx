import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ViewStyle } from 'react-native';
import { X, Check, ChevronRight } from 'lucide-react';
import { SelectOption, MODAL_THEME } from '../UnifiedExerciseModal.types';

const TAPS_HANDLED = 'handled' as const;
const BLUE_COLOR = '#1d4ed8';

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
    padding: 10,
    paddingVertical: 12,
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
    fontSize: 14,
    color: MODAL_THEME.colors.textSecondary,
    paddingVertical: 2,
  },
  tag: {
    backgroundColor: '#dbeafe',
    borderRadius: 4,
    paddingLeft: 8,
    paddingRight: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
    marginVertical: 2,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  tagRemove: {
    marginLeft: 4,
    padding: 2,
  },
  multiSelectDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
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
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  multiSelectItemText: {
    fontSize: 13,
    color: MODAL_THEME.colors.text,
  },
  multiSelectItemActive: {
    color: MODAL_THEME.colors.primary,
    fontWeight: '800',
  },
  multiSelectCloseButton: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  multiSelectCloseText: {
    fontSize: 12,
    fontWeight: '700',
    color: MODAL_THEME.colors.textSecondary,
  },
});
