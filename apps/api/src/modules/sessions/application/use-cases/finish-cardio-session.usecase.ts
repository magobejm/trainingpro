import { Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { EmitSessionCompletedEventUseCase } from '../../../notifications/application/use-cases/emit-session-completed-event.usecase';
import { EditWindowPolicy } from '../../domain/policies/edit-window.policy';
import { SessionAccessPolicy } from '../../domain/policies/session-access.policy';
import type { FinishSessionInput } from '../../domain/session.input';
import { SESSIONS_REPOSITORY, type SessionsRepositoryPort } from '../../domain/sessions-repository.port';

@Injectable()
export class FinishCardioSessionUseCase {
  constructor(
    @Inject(SESSIONS_REPOSITORY) private readonly repository: SessionsRepositoryPort,
    private readonly accessPolicy: SessionAccessPolicy,
    private readonly editWindowPolicy: EditWindowPolicy,
    private readonly emitSessionCompletedEventUseCase: EmitSessionCompletedEventUseCase,
  ) {}

  async execute(context: AuthContext, input: FinishSessionInput, timezoneOffsetMinutes: number) {
    await this.accessPolicy.assertCanAccess(context, input.sessionId);
    const clientTime = input.finishedAt ?? null;
    const session = await this.repository.getCardioSessionById(context, input.sessionId, {
      closeStale: clientTime == null,
    });
    if (session) {
      this.editWindowPolicy.resolveWriteInstant(session.sessionDate, new Date(), timezoneOffsetMinutes, clientTime);
    }
    const result = await this.repository.finishCardioSession(context, input);
    await this.emitSessionCompletedEventUseCase.execute(result.id);
    return result;
  }
}
