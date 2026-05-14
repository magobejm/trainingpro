import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { EditWindowPolicy } from '../../domain/policies/edit-window.policy';
import { SessionAccessPolicy } from '../../domain/policies/session-access.policy';
import type { LogMobilitySetInput } from '../../domain/session.input';
import { SESSIONS_REPOSITORY, type SessionsRepositoryPort } from '../../domain/sessions-repository.port';

@Injectable()
export class LogMobilitySetUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY) private readonly repository: SessionsRepositoryPort,
    private readonly accessPolicy: SessionAccessPolicy,
    private readonly editWindowPolicy: EditWindowPolicy,
  ) {}

  async execute(context: AuthContext, input: LogMobilitySetInput, timezoneOffsetMinutes: number) {
    await this.accessPolicy.assertCanAccess(context, input.sessionId);
    const session = await this.repository.getSessionById(context, input.sessionId);
    if (session) {
      this.editWindowPolicy.assertCanEdit(session.sessionDate, new Date(), timezoneOffsetMinutes);
    }
    return this.repository.logMobilitySet(context, input);
  }
}
