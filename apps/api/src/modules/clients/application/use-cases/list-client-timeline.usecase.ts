import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import type { TimelineCursor, TimelinePage } from '../../domain/client-timeline';
import { readClientTimeline } from '../../infra/prisma/client-timeline.prisma';
import { GetClientUseCase } from './get-client.usecase';

@Injectable()
export class ListClientTimelineUseCase {
  constructor(
    private readonly getClient: GetClientUseCase,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    context: AuthContext,
    clientId: string,
    input: { cursor: TimelineCursor; limit: number; includeOutcome?: boolean },
  ): Promise<TimelinePage> {
    await this.getClient.execute(context, clientId);
    return readClientTimeline(this.prisma, clientId, input);
  }
}
