import { ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { FileUploadPolicy } from '../../../files/domain/policies/file-upload.policy';
import { ChatThreadAccessService } from '../../infra/prisma/chat-thread-access.service';

export type CreateUploadPolicyInput = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  threadId: string;
};

@Injectable()
export class CreateUploadPolicyUseCase {
  constructor(
    private readonly threadAccess: ChatThreadAccessService,
    private readonly uploadPolicy: FileUploadPolicy,
  ) {}

  async execute(context: AuthContext, input: CreateUploadPolicyInput) {
    this.assertRole(context.activeRole);
    await this.threadAccess.assertAccess(context, input.threadId);
    return this.uploadPolicy.createPolicy(input);
  }

  private assertRole(role: AuthContext['activeRole']): void {
    if (role === 'client' || role === 'coach') {
      return;
    }
    throw new ForbiddenException('Unsupported role for file upload policy');
  }
}
