import React from 'react';
import { Text, View } from 'react-native';
import { s } from '../../RoutinePlanner.styles';
import type { DraftState } from '../../RoutinePlanner.types';
import { RoutinePlannerMetaFields } from './RoutinePlannerMetaFields';
import { SuccessBanner } from './SuccessBanner';
import type { PlannerLabels } from './planner-labels';

type Props = {
  draft: DraftState;
  editingId?: string | null;
  isReadOnly: boolean;
  labels: PlannerLabels;
  objectiveOptions: Array<{ id: string; label: string }>;
  saveSuccess: boolean;
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
  t: (key: string) => string;
};

export function RoutinePlannerTopSection(props: Props): React.JSX.Element {
  const showName = Boolean(props.editingId) && Boolean(props.draft.name);
  return (
    <>
      <Text style={s.title}>{props.t(props.labels.titleKey)}</Text>
      {props.saveSuccess && <SuccessBanner t={props.t} />}
      {showName && (
        <View
          style={{
            alignSelf: 'flex-start',
            backgroundColor: '#eff6ff',
            borderColor: '#3b82f6',
            borderRadius: 8,
            borderWidth: 1,
            marginBottom: 12,
            paddingHorizontal: 14,
            paddingVertical: 6,
          }}
        >
          <Text
            style={{
              color: '#1d4ed8',
              fontSize: 13,
              fontWeight: '700',
              letterSpacing: 0.8,
              textTransform: 'uppercase',
            }}
          >
            {props.draft.name}
          </Text>
        </View>
      )}
      <RoutinePlannerMetaFields
        draft={props.draft}
        isReadOnly={props.isReadOnly}
        objectiveOptions={props.objectiveOptions}
        setDraft={props.setDraft}
        t={props.t}
      />
    </>
  );
}
