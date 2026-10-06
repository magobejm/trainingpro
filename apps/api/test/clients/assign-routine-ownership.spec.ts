import { ForbiddenException } from '@nestjs/common';
import { assertAssignableTrainingPlan } from '../../src/modules/clients/domain/training-plan-assignment';

const COACH = 'membership-a';

describe('assign routine ownership', () => {
  it('rejects a template owned by another coach', () => {
    expect(() => assertAssignableTrainingPlan({ coachMembershipId: 'membership-b', scope: 'COACH' }, COACH)).toThrow(
      ForbiddenException,
    );
  });

  it('accepts the coach own template', () => {
    expect(() => assertAssignableTrainingPlan({ coachMembershipId: COACH, scope: 'COACH' }, COACH)).not.toThrow();
  });

  it('accepts a global catalog template', () => {
    expect(() => assertAssignableTrainingPlan({ coachMembershipId: null, scope: 'GLOBAL' }, COACH)).not.toThrow();
  });

  it('rejects a missing template', () => {
    expect(() => assertAssignableTrainingPlan(null, COACH)).toThrow(ForbiddenException);
  });
});
