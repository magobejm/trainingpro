import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Prisma, WearableProviderKind } from '@prisma/client';
import { mapCardioToGarminWorkout, mergeDailyMetrics, visibleToCoach, type WearableSource } from '@trainerpro/shared';
import type { AuthContext } from '../../common/auth-context/auth-context';
import { decryptToken, encryptToken, readState, signState } from '../../common/crypto/token-cipher';
import { PrismaService } from '../../common/prisma/prisma.service';
import { resolveCoachMembership } from '../clients/infra/prisma/client.repository.prisma.ops';
import { GetClientMeUseCase } from '../clients/application/use-cases/get-client-me.usecase';
import { authorizeUrl, createPkce, providerConfigured, toPrismaProvider, type CloudProvider } from './integration-providers';

const SHORT_SLEEP_MINUTES = 360;
const LOW_HRV_MS = 25;

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly getMe: GetClientMeUseCase,
    private readonly prisma: PrismaService,
  ) {}

  async authorize(context: AuthContext, provider: CloudProvider) {
    if (!providerConfigured(provider)) {
      throw new ServiceUnavailableException('La conexión no está configurada. Puedes intentarlo de nuevo.');
    }
    const client = await this.getMe.execute(context);
    const pkce = createPkce();
    const state = signState({ clientId: client.id, provider, verifier: pkce.verifier }, this.secret());
    const redirectUri = this.redirectUri(provider);
    return { url: authorizeUrl(provider, { codeChallenge: pkce.challenge, redirectUri, state }) };
  }

  async callback(provider: CloudProvider, code: string, stateToken: string) {
    const state = readState(stateToken, this.secret());
    if (!state || state.provider !== provider || !state.clientId) throw new BadRequestException('Invalid OAuth state');
    if (!providerConfigured(provider)) throw new ServiceUnavailableException('La conexión no está configurada.');
    await this.prisma.wearableConnection.upsert({
      create: {
        accessTokenEnc: encryptToken(`mock:${code}`, this.secret()),
        clientId: state.clientId,
        provider: toPrismaProvider(provider),
        scopes: provider === 'strava' ? ['activity:write'] : [],
        status: 'CONNECTED',
      },
      update: { accessTokenEnc: encryptToken(`mock:${code}`, this.secret()), status: 'CONNECTED' },
      where: { clientId_provider: { clientId: state.clientId, provider: toPrismaProvider(provider) } },
    });
    return { url: `trainerpro://integrations/${provider}?status=ok` };
  }

  async disconnect(context: AuthContext, provider: CloudProvider) {
    const client = await this.getMe.execute(context);
    const kind = toPrismaProvider(provider);
    await this.prisma.wearableActivity.deleteMany({ where: { clientId: client.id, source: kind } });
    await this.prisma.dailyHealthMetric.deleteMany({ where: { clientId: client.id, source: kind } });
    await this.prisma.wearableConnection.deleteMany({ where: { clientId: client.id, provider: kind } });
    return { status: 'revoked' };
  }

  async enqueueWebhook(provider: CloudProvider, type: string, payload: unknown, mockSecret: string | undefined) {
    if (!this.webhookAllowed(provider, mockSecret)) throw new BadRequestException('Invalid webhook signature');
    await this.prisma.integrationEvent.create({
      data: { payload: payload as Prisma.InputJsonValue, provider: toPrismaProvider(provider), type },
    });
    return { status: 'accepted' };
  }

  async processEvents() {
    const events = await this.prisma.integrationEvent.findMany({
      orderBy: { createdAt: 'asc' },
      take: 20,
      where: { status: 'PENDING' },
    });
    let processed = 0;
    for (const event of events) {
      try {
        await this.applyEvent(event.provider, event.type, event.payload);
        await this.prisma.integrationEvent.update({
          data: { processedAt: new Date(), status: 'PROCESSED' },
          where: { id: event.id },
        });
        processed += 1;
      } catch (error) {
        await this.prisma.integrationEvent.update({
          data: { attempts: { increment: 1 }, error: error instanceof Error ? error.message : 'error', status: 'FAILED' },
          where: { id: event.id },
        });
      }
    }
    const exported = await this.exportPendingStrava();
    return { exported, processed };
  }

  async exportPendingStrava() {
    const connections = await this.prisma.wearableConnection.findMany({
      where: { autoExport: true, provider: 'STRAVA', status: 'CONNECTED' },
    });
    let exported = 0;
    for (const connection of connections) {
      const sessions = await this.prisma.sessionInstance.findMany({
        orderBy: { finishedAt: 'desc' },
        take: 5,
        where: { clientId: connection.clientId, isCompleted: true },
      });
      for (const session of sessions) {
        const externalId = `session:${session.id}`;
        const existing = await this.prisma.wearableActivity.findUnique({
          where: { source_externalId: { externalId, source: 'STRAVA' } },
        });
        if (existing) continue;
        await this.prisma.wearableActivity.create({
          data: {
            clientId: connection.clientId,
            durationS: session.performedDurationSeconds ?? 0,
            externalId,
            source: 'STRAVA',
            sportType: 'WeightTraining',
            startAt: session.startedAt ?? session.finishedAt ?? new Date(),
          },
        });
        exported += 1;
      }
    }
    return exported;
  }

  async saveDaily(context: AuthContext, source: WearableProviderKind, days: DailyWrite[]) {
    const client = await this.getMe.execute(context);
    for (const day of days) {
      const date = new Date(`${day.date}T00:00:00.000Z`);
      const data = metricData(day);
      await this.prisma.dailyHealthMetric.upsert({
        create: { ...data, clientId: client.id, date, source },
        update: data,
        where: { clientId_date_source: { clientId: client.id, date, source } },
      });
      if (day.weightKg != null) await this.recordWearableWeight(client.id, day.date, day.weightKg);
    }
    return { saved: days.length };
  }

  async saveActivities(context: AuthContext, source: WearableProviderKind, activities: ActivityWrite[]) {
    const client = await this.getMe.execute(context);
    for (const activity of activities) {
      const data = activityData(activity);
      await this.prisma.wearableActivity.upsert({
        create: { ...data, clientId: client.id, externalId: activity.externalId, source },
        update: data,
        where: { source_externalId: { externalId: activity.externalId, source } },
      });
    }
    return { saved: activities.length };
  }

  async checkinHint(context: AuthContext) {
    const client = await this.getMe.execute(context);
    const today = dateOnly(new Date());
    const rows = await this.prisma.dailyHealthMetric.findMany({ where: { clientId: client.id, date: today } });
    const merged = mergeDailyMetrics(
      rows.map((row) => ({ ...row, source: row.source as WearableSource, weightKg: numberOrNull(row.weightKg) })),
    );
    const sleep = merged.sleepMinutes == null ? null : Math.max(1, Math.min(5, Math.round(merged.sleepMinutes / 90)));
    const recovery = merged.hrvMs == null ? null : merged.hrvMs < LOW_HRV_MS ? 2 : 4;
    return { recovery, sleep };
  }

  async coachView(context: AuthContext, clientId: string) {
    const membership = await resolveCoachMembership(context, this.prisma);
    const client = await this.prisma.client.findFirst({ where: { coachMembershipId: membership.id, id: clientId } });
    if (!client) throw new NotFoundException('Client not found');
    const [connections, metrics, activities] = await Promise.all([
      this.prisma.wearableConnection.findMany({ where: { clientId } }),
      this.prisma.dailyHealthMetric.findMany({ orderBy: { date: 'desc' }, take: 14, where: { clientId } }),
      this.prisma.wearableActivity.findMany({ orderBy: { startAt: 'desc' }, take: 20, where: { clientId } }),
    ]);
    return {
      activities: activities.filter((row) => visibleToCoach(row.source as WearableSource)).map(publicActivity),
      connections: connections.map((row) => ({ provider: row.provider, status: row.status })),
      metrics: metrics.filter((row) => visibleToCoach(row.source as WearableSource)).map(publicMetric),
    };
  }

  async sendToWatch(context: AuthContext, clientId: string, input: WatchInput) {
    const membership = await resolveCoachMembership(context, this.prisma);
    const client = await this.prisma.client.findFirst({ where: { coachMembershipId: membership.id, id: clientId } });
    if (!client) throw new NotFoundException('Client not found');
    const connection = await this.prisma.wearableConnection.findUnique({
      where: { clientId_provider: { clientId, provider: 'GARMIN' } },
    });
    const workout = mapCardioToGarminWorkout({ ...input, fcMax: client.fcMax, fcRest: client.fcRest });
    if (!connection || connection.status !== 'CONNECTED') {
      return { status: 'unlinked', workout };
    }
    const simulated = !connection.accessTokenEnc || !providerConfigured('garmin');
    const row = await this.prisma.garminWorkoutSync.create({
      data: {
        clientId,
        garminWorkoutId: simulated ? null : `garmin-${Date.now()}`,
        payload: workout,
        routineKey: input.routineKey,
        status: simulated ? 'simulated' : 'sent',
      },
    });
    return { id: row.id, status: row.status, workout };
  }

  async signalsFor(clientIds: string[]) {
    const today = dateOnly(new Date());
    const rows = await this.prisma.dailyHealthMetric.findMany({ where: { clientId: { in: clientIds }, date: today } });
    return rows.flatMap((row) => {
      if (!visibleToCoach(row.source as WearableSource)) return [];
      const shortSleep = row.sleepMinutes != null && row.sleepMinutes < SHORT_SLEEP_MINUTES;
      const lowHrv = row.hrvMs != null && row.hrvMs < LOW_HRV_MS;
      if (shortSleep || lowHrv) {
        return [{ clientId: row.clientId, hrvMs: row.hrvMs, sleepMinutes: row.sleepMinutes }];
      }
      return [];
    });
  }

  async myConnections(context: AuthContext) {
    const client = await this.getMe.execute(context);
    const rows = await this.prisma.wearableConnection.findMany({ where: { clientId: client.id } });
    return { connections: rows.map((row) => ({ autoExport: row.autoExport, provider: row.provider, status: row.status })) };
  }

  async setAutoExport(context: AuthContext, autoExport: boolean) {
    const client = await this.getMe.execute(context);
    await this.prisma.wearableConnection.updateMany({
      data: { autoExport },
      where: { clientId: client.id, provider: 'STRAVA' },
    });
    return { autoExport };
  }

  tokenFor(connection: { accessTokenEnc: string | null }): string | null {
    if (!connection.accessTokenEnc) return null;
    return decryptToken(connection.accessTokenEnc, this.secret());
  }

  private async applyEvent(provider: WearableProviderKind, type: string, payload: Prisma.JsonValue) {
    const body = (payload ?? {}) as { clientId?: string; externalUserId?: string };
    if (type === 'deregistration' && body.clientId) {
      await this.prisma.wearableConnection.updateMany({
        data: { status: 'REVOKED' },
        where: { clientId: body.clientId, provider },
      });
    }
  }

  private async recordWearableWeight(clientId: string, date: string, weightKg: number) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const existing = await this.prisma.clientMeasurement.findFirst({
      where: {
        clientId,
        measuredAt: { gte: start, lt: new Date(start.getTime() + 86_400_000) },
        notes: { not: 'wearable' },
      },
    });
    if (existing) return;
    await this.prisma.clientMeasurement.create({
      data: { clientId, measuredAt: start, notes: 'wearable', recordedBy: 'client', weightKg },
    });
  }

  private webhookAllowed(provider: CloudProvider, mockSecret: string | undefined): boolean {
    if (providerConfigured(provider)) return mockSecret === process.env.CRON_SECRET && Boolean(mockSecret);
    return process.env.NODE_ENV !== 'production' && mockSecret === process.env.CRON_SECRET && Boolean(mockSecret);
  }

  private secret(): string {
    const value = process.env.INTEGRATIONS_TOKEN_KEY;
    if (!value) throw new ServiceUnavailableException('La conexión no está configurada. Puedes intentarlo de nuevo.');
    return value;
  }

  private redirectUri(provider: CloudProvider): string {
    return `${process.env.PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8080'}/integrations/${provider}/callback`;
  }
}

type DailyWrite = {
  activeKcal?: number | null;
  bodyBattery?: number | null;
  date: string;
  hrvMs?: number | null;
  restingHr?: number | null;
  sleepMinutes?: number | null;
  sleepScore?: number | null;
  steps?: number | null;
  weightKg?: number | null;
};

type ActivityWrite = {
  avgHr?: number | null;
  calories?: number | null;
  distanceM?: number | null;
  durationS: number;
  externalId: string;
  lapsJson?: Prisma.InputJsonValue | null;
  maxHr?: number | null;
  sportType: string;
  startAt: string;
};

type WatchInput = {
  blocks: Parameters<typeof mapCardioToGarminWorkout>[0]['blocks'];
  name: string;
  routineKey: string;
};

function publicActivity(row: {
  distanceM: number | null;
  durationS: number;
  id: string;
  source: string;
  sportType: string;
  startAt: Date;
}) {
  return {
    distanceM: row.distanceM,
    durationS: row.durationS,
    id: row.id,
    source: row.source,
    sportType: row.sportType,
    startAt: row.startAt.toISOString(),
  };
}

function publicMetric(row: {
  date: Date;
  hrvMs: number | null;
  restingHr: number | null;
  sleepMinutes: number | null;
  source: string;
  steps: number | null;
}) {
  return {
    date: row.date.toISOString().slice(0, 10),
    hrvMs: row.hrvMs,
    restingHr: row.restingHr,
    sleepMinutes: row.sleepMinutes,
    source: row.source,
    steps: row.steps,
  };
}

function numberOrNull(value: Prisma.Decimal | null): number | null {
  return value == null ? null : Number(value);
}

function dateOnly(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function metricData(day: DailyWrite) {
  return {
    activeKcal: day.activeKcal,
    bodyBattery: day.bodyBattery,
    hrvMs: day.hrvMs,
    restingHr: day.restingHr,
    sleepMinutes: day.sleepMinutes,
    sleepScore: day.sleepScore,
    steps: day.steps,
    weightKg: day.weightKg,
  };
}

function activityData(activity: ActivityWrite) {
  return {
    avgHr: activity.avgHr,
    calories: activity.calories,
    distanceM: activity.distanceM,
    durationS: activity.durationS,
    lapsJson: activity.lapsJson ?? Prisma.JsonNull,
    maxHr: activity.maxHr,
    sportType: activity.sportType,
    startAt: new Date(activity.startAt),
  };
}
