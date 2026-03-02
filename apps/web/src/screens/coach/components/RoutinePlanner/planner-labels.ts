export type PlannerLabels = {
  addContainerKey: string;
  containerPlaceholderKey: string;
  containerPrefixKey: string;
  deleteContainerKey: string;
  emptyContainerKey: string;
  nameKey: string;
  namePlaceholderKey: string;
  titleKey: string;
};

export const ROUTINE_LABELS: PlannerLabels = {
  addContainerKey: 'coach.routine.addDay',
  containerPlaceholderKey: 'coach.routine.dayTitlePlaceholder',
  containerPrefixKey: 'coach.routine.dayPrefix',
  deleteContainerKey: 'coach.routine.deleteDay',
  emptyContainerKey: 'coach.routine.emptyDay',
  nameKey: 'coach.routine.name',
  namePlaceholderKey: 'coach.routine.namePlaceholder',
  titleKey: 'coach.routine.title',
};

export const WARMUP_LABELS: PlannerLabels = {
  addContainerKey: 'coach.warmupPlanner.addGroup',
  containerPlaceholderKey: 'coach.warmupPlanner.groupTitlePlaceholder',
  containerPrefixKey: 'coach.warmupPlanner.groupPrefix',
  deleteContainerKey: 'coach.warmupPlanner.deleteGroup',
  emptyContainerKey: 'coach.warmupPlanner.emptyGroup',
  nameKey: 'coach.warmupPlanner.name',
  namePlaceholderKey: 'coach.warmupPlanner.namePlaceholder',
  titleKey: 'coach.warmupPlanner.title',
};
