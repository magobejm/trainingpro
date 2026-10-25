import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { AuthContext } from '../../src/common/auth-context/auth-context';
import { AnalyzeTechniqueUseCase } from '../../src/modules/ai-evaluator/usecases/analyze-technique.usecase';

const coach: AuthContext = { activeRole: 'coach', email: 'c@x.dev', roles: ['coach'], subject: 'coach-1' };
const ATTACHMENT = '22222222-2222-4222-8222-222222222222';

function build(options: {
  access?: jest.Mock;
  attachment?: { kind: string; message: { threadId: string }; mimeType: string; storagePath: string } | null;
  configured?: boolean;
  stored?: { contentType: string; data: Buffer } | null;
}) {
  const gemini = {
    generateJson: jest.fn().mockResolvedValue({ score_seguridad: 80 }),
    isConfigured: () => options.configured ?? true,
  };
  const prisma = { chatAttachment: { findUnique: jest.fn().mockResolvedValue(options.attachment ?? null) } };
  const access = { assertAccess: options.access ?? jest.fn().mockResolvedValue({}) };
  const storage = { download: jest.fn().mockResolvedValue(options.stored ?? null) };
  const useCase = new AnalyzeTechniqueUseCase(gemini as never, prisma as never, access as never, storage as never);
  return { access, gemini, storage, useCase };
}

const image = { kind: 'IMAGE', message: { threadId: 't1' }, mimeType: 'image/jpeg', storagePath: 'chat/t1/a.jpg' };

describe('AnalyzeTechniqueUseCase.executeForAttachment', () => {
  it('rejects an unknown attachment', async () => {
    const { useCase } = build({ attachment: null });
    await expect(useCase.executeForAttachment(coach, ATTACHMENT)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not read storage when the coach has no access to the thread', async () => {
    const access = jest.fn().mockRejectedValue(new ForbiddenException('denied'));
    const { storage, useCase } = build({ access, attachment: image });
    await expect(useCase.executeForAttachment(coach, ATTACHMENT)).rejects.toBeInstanceOf(ForbiddenException);
    expect(storage.download).not.toHaveBeenCalled();
  });

  it('rejects attachments that are not video or image', async () => {
    const { useCase } = build({ attachment: { ...image, kind: 'PDF', mimeType: 'application/pdf' } });
    await expect(useCase.executeForAttachment(coach, ATTACHMENT)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sends the stored image to Gemini with the exercise name', async () => {
    const { gemini, useCase } = build({
      attachment: image,
      stored: { contentType: 'image/jpeg', data: Buffer.from('jpg') },
    });
    await expect(useCase.executeForAttachment(coach, ATTACHMENT, 'Sentadilla')).resolves.toEqual({ score_seguridad: 80 });
    const call = gemini.generateJson.mock.calls[0]?.[0] as { parts: Array<{ text?: string }> };
    expect(call.parts[0]?.text).toContain('Sentadilla');
  });

  it('answers 503 when Gemini is not configured', async () => {
    const { useCase } = build({
      attachment: image,
      configured: false,
      stored: { contentType: 'image/jpeg', data: Buffer.from('jpg') },
    });
    await expect(useCase.executeForAttachment(coach, ATTACHMENT)).rejects.toMatchObject({ status: 503 });
  });
});
