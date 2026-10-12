import { getLayoutStyle1, getLayoutStyle2 } from './RoutinePlannerTopSection.layout-styles';

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
  objectiveOptions: Array<{
    id: string;
    label: string;
  }>;
  saveSuccess: boolean;
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
  t: (key: string) => string;
};
export function RoutinePlannerTopSection(props: Props): React.JSX.Element {
  const showName = Boolean(props.editingId) && Boolean(props.draft.name);
  const layoutStyle1 = getLayoutStyle1;
  const layoutStyle2 = getLayoutStyle2;
  return (
    <>
      <Text style={s.title}>{props.t(props.labels.titleKey)}</Text>
      {props.saveSuccess && <SuccessBanner t={props.t} />}
      {showName && (
        <View style={layoutStyle1}>
          <Text style={layoutStyle2}>{props.draft.name}</Text>
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
