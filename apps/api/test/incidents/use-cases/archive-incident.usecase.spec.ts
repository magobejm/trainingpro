import { ArchiveIncidentUseCase } from '../../../src/modules/incidents/application/use-cases/archive-incident.usecase';

const mockRepository = {
  archiveIncident: jest.fn(),
};

describe('ArchiveIncidentUseCase', () => {
  let useCase: ArchiveIncidentUseCase;

  beforeEach(() => {
    mockRepository.archiveIncident.mockReset();
    useCase = new ArchiveIncidentUseCase(mockRepository as never);
  });

  it('delegates to the repository with context and incident id', async () => {
    const context = { subject: 'client-1', activeRole: 'client' as const } as never;
    mockRepository.archiveIncident.mockResolvedValue(undefined);

    await useCase.execute(context, 'incident-123');

    expect(mockRepository.archiveIncident).toHaveBeenCalledWith(context, 'incident-123');
  });
});
