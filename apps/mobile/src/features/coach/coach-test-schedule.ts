import type { PhysicalTestView, PhysicalTestResultView } from '../../data/hooks/usePhysicalTests';

export type CoachPhysicalTestSchedule = {
  id: string;
  physicalTestId: string;
  physicalTestName: string;
  scheduledDate: string;
  done: boolean;
  result: PhysicalTestResultView | null;
};
export function testForCoachSchedule(
  schedule: Pick<CoachPhysicalTestSchedule, 'physicalTestId'>,
  catalog: PhysicalTestView[],
) {
  return catalog.find((test) => test.id === schedule.physicalTestId);
}
