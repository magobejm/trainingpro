import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { EditWindowPolicy } from '../../domain/policies/edit-window.policy';
import { SessionAccessPolicy } from '../../domain/policies/session-access.policy';
import type { LogIsometricSetInput } from '../../domain/session.input';
import { SESSIONS_REPOSITORY, type SessionsRepositoryPort } from '../../domain/sessions-repository.port';
import { guardSessionWrite, keepQueuedSessionOpen } from '../guard-session-write';

@Injectable()
export class LogIsometricSetUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY) private readonly repository: SessionsRepositoryPort,
    private readonly accessPolicy: SessionAccessPolicy,
    private readonly editWindowPolicy: EditWindowPolicy,
  ) {}

  async execute(
    context: AuthContext,
    input: LogIsometricSetInput,
    timezoneOffsetMinutes: number,
    occurredAt: Date | null = null,
  ) {
    await this.accessPolicy.assertCanAccess(context, input.sessionId);
    await guardSessionWrite(
      this.repository,
      this.editWindowPolicy,
      context,
      input.sessionId,
      timezoneOffsetMinutes,
      occurredAt,
    );
    return this.repository.logIsometricSet(context, input, keepQueuedSessionOpen(occurredAt));
  }
}
