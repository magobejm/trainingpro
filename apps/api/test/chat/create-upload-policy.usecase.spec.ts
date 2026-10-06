import { ForbiddenException } from '@nestjs/common';
import type { AuthContext } from '../../src/common/auth-context/auth-context';
import { CreateUploadPolicyUseCase } from '../../src/modules/chat/application/use-cases/create-upload-policy.usecase';
import type { ChatThreadAccessService } from '../../src/modules/chat/infra/prisma/chat-thread-access.service';
import { FileUploadPolicy } from '../../src/modules/files/domain/policies/file-upload.policy';

const THREAD = '11111111-1111-4111-8111-111111111111';

const coach: AuthContext = {
  activeRole: 'coach',
  email: 'coach@fitcoach.local',
  roles: ['coach'],
  subject: 'coach-1',
};

describe('CreateUploadPolicyUseCase', () => {
  it('rejects before building a path when the caller is outside the thread', async () => {
    const access = {
      assertAccess: jest.fn().mockRejectedValue(new ForbiddenException('Chat thread access denied')),
    };
    const policy = { createPolicy: jest.fn() };
    const useCase = new CreateUploadPolicyUseCase(
      access as unknown as ChatThreadAccessService,
      policy as unknown as FileUploadPolicy,
    );

    await expect(useCase.execute(coach, validInput())).rejects.toBeInstanceOf(ForbiddenException);
    expect(policy.createPolicy).not.toHaveBeenCalled();
  });

  it('keeps a sanitized file name inside the thread prefix', async () => {
    const access = {
      assertAccess: jest.fn().mockResolvedValue({ senderRole: 'COACH', threadId: THREAD }),
    };
    const useCase = new CreateUploadPolicyUseCase(access as unknown as ChatThreadAccessService, new FileUploadPolicy());

    const result = await useCase.execute(coach, { ...validInput(), fileName: '../../x' });

    expect(result.path.startsWith(`chat/${THREAD}/`)).toBe(true);
    expect(result.path.split('/')).toHaveLength(3);
  });

  it('rejects a role that cannot upload', async () => {
    const access = { assertAccess: jest.fn() };
    const useCase = new CreateUploadPolicyUseCase(access as unknown as ChatThreadAccessService, new FileUploadPolicy());
    const admin: AuthContext = { activeRole: 'admin', roles: ['admin'], subject: 'admin-1' };

    await expect(useCase.execute(admin, validInput())).rejects.toThrow('Unsupported role for file upload policy');
    expect(access.assertAccess).not.toHaveBeenCalled();
  });
});

function validInput() {
  return {
    fileName: 'note.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1000,
    threadId: THREAD,
  };
}
