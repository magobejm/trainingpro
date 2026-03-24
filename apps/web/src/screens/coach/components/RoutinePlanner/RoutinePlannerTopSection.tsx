import React from 'react';
import { Text } from 'react-native';
import { s } from '../../RoutinePlanner.styles';
import type { DraftState } from '../../RoutinePlanner.types';
import { RoutinePlannerMetaFields } from './RoutinePlannerMetaFields';
import { ReadOnlyBadge } from './ReadOnlyBadge';
import { SuccessBanner } from './SuccessBanner';
import type { PlannerLabels } from './planner-labels';

type Props = {
  draft: DraftState;
  isReadOnly: boolean;
  labels: PlannerLabels;
  objectiveOptions: Array<{ id: string; label: string }>;
  saveSuccess: boolean;
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
  t: (key: string) => string;
};

export function RoutinePlannerTopSection(props: Props): React.JSX.Element {
  return (
    <>
      <Text style={s.title}>{props.t(props.labels.titleKey)}</Text>
      {props.saveSuccess && <SuccessBanner t={props.t} />}
      {props.isReadOnly && <ReadOnlyBadge t={props.t} />}
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
