import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable, ViewStyle } from 'react-native';
import { X, Check, ChevronRight } from 'lucide-react';
import { MODAL_THEME } from '../UnifiedExerciseModal.types';

const TAPS_HANDLED = 'handled' as const;
const BLUE_COLOR = '#1d4ed8';
const ACCESSIBILITY_ROLE_BUTTON = 'button' as const;

export type TagMultiSelectOption = { label: string; value: string };

export interface TagMultiSelectProps {
  options: TagMultiSelectOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  placeholder: string;
  doneLabel: string;
  zIndex?: number;
}

export function TagMultiSelect(props: TagMultiSelectProps) {
  const { options, selectedIds, onToggle, expanded, setExpanded, placeholder, doneLabel, zIndex = 50 } = props;

  const selectedOptions = useMemo(() => options.filter((o) => selectedIds.includes(o.value)), [options, selectedIds]);
  const close = () => setExpanded(false);

  return (
    <View style={[styles.multiSelectOuter, { zIndex }, expanded && styles.multiSelectOuterExpanded]}>
      {expanded && <Pressable accessibilityRole={ACCESSIBILITY_ROLE_BUTTON} onPress={close} style={styles.backdrop} />}
      <View style={styles.multiSelectSurface}>
        <SelectHeader
          expanded={expanded}
          setExpanded={setExpanded}
          placeholder={placeholder}
          selectedOptions={selectedOptions}
          onToggle={onToggle}
        />
        {expanded && (
          <Dropdown options={options} selectedIds={selectedIds} onToggle={onToggle} onDone={close} doneLabel={doneLabel} />
        )}
      </View>
    </View>
  );
}

function SelectHeader(props: {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  placeholder: string;
  selectedOptions: TagMultiSelectOption[];
  onToggle: (id: string) => void;
}) {
  const { expanded, setExpanded, placeholder, selectedOptions, onToggle } = props;
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
            <SelectedTag key={opt.value} label={opt.label} onRemove={() => onToggle(opt.value)} />
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
  options: TagMultiSelectOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onDone: () => void;
  doneLabel: string;
}) {
  const { options, selectedIds, onToggle, onDone, doneLabel } = props;
  return (
    <View style={styles.multiSelectDropdown}>
      <ScrollView style={styles.multiSelectScroll} nestedScrollEnabled keyboardShouldPersistTaps={TAPS_HANDLED}>
        {options.map((opt) => {
          const isSelected = selectedIds.includes(opt.value);
          return (
            <TouchableOpacity key={opt.value} style={styles.multiSelectItem} onPress={() => onToggle(opt.value)}>
              <Text style={[styles.multiSelectItemText, isSelected && styles.multiSelectItemActive]}>{opt.label}</Text>
              {isSelected && <Check size={14} color={MODAL_THEME.colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <TouchableOpacity style={styles.multiSelectDoneButton} onPress={onDone}>
        <Text style={styles.multiSelectDoneText}>{doneLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  multiSelectOuter: {
    position: 'relative',
  },
  multiSelectOuterExpanded: {
    marginBottom: 260,
  },
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  } as unknown as ViewStyle,
  multiSelectSurface: {
    position: 'relative',
    zIndex: 1,
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
    overflow: 'hidden',
  } as ViewStyle,
  multiSelectScroll: {
    maxHeight: 200,
  },
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
  multiSelectDoneButton: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: MODAL_THEME.colors.primary,
    borderTopWidth: 1,
    borderTopColor: MODAL_THEME.colors.border,
  },
  multiSelectDoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
});
