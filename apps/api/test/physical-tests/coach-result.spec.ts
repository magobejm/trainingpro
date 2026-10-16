import { PhysicalTestsService } from '../../src/modules/physical-tests/application/physical-tests.service';
import type { PhysicalTestsRepository } from '../../src/modules/physical-tests/infra/prisma/physical-tests.repository';
import type { AuthContext } from '../../src/common/auth-context/auth-context';

describe('coach scheduled physical test result', () => {
  it('passes the schedule through after verifying ownership, without storing it among measured inputs', async () => {
    const repository = {
      assertCoachOwnsClient: jest.fn().mockResolvedValue({ id: 'coach-membership' }),
      readPhysicalTestById: jest.fn().mockResolvedValue({ code: 'cooper' }),
      recordResult: jest.fn().mockResolvedValue({ id: 'result' }),
    };
    const service = new PhysicalTestsService(repository as unknown as PhysicalTestsRepository);
    await service.recordResultForCoach({} as AuthContext, 'client', 'test', {
      age: 30,
      gender: 'M',
      distance: 2400,
      scheduleId: 'schedule',
    });
    expect(repository.assertCoachOwnsClient).toHaveBeenCalledWith({}, 'client');
    expect(repository.recordResult).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'client',
        physicalTestId: 'test',
        recordedByMembershipId: 'coach-membership',
        scheduleId: 'schedule',
      }),
    );
    expect(repository.recordResult.mock.calls[0][0].inputs).not.toHaveProperty('scheduleId');
  });
});
