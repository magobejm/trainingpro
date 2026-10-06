import { ForbiddenException } from '@nestjs/common';

export type AssignableTrainingPlan = {
  coachMembershipId: string | null;
  scope: 'COACH' | 'GLOBAL';
};

export function assertAssignableTrainingPlan(plan: AssignableTrainingPlan | null, coachMembershipId: string): void {
  if (plan?.scope === 'GLOBAL' && plan.coachMembershipId === null) {
    return;
  }
  if (plan?.coachMembershipId === coachMembershipId) {
    return;
  }
  throw new ForbiddenException('Training plan is not assignable');
}
