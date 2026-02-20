import { ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { FileUploadPolicy } from '../../domain/policies/file-upload.policy';

export type CreateUploadPolicyInput = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  threadId: string;
};

@Injectable()
export class CreateUploadPolicyUseCase {
  constructor(private readonly uploadPolicy: FileUploadPolicy) {}

  execute(context: AuthContext, input: CreateUploadPolicyInput) {
    this.assertRole(context.activeRole);
    return this.uploadPolicy.createPolicy(input);
  }

  private assertRole(role: AuthContext['activeRole']): void {
    if (role === 'client' || role === 'coach') {
      return;
    }
    throw new ForbiddenException('Unsupported role for file upload policy');
  }
}
