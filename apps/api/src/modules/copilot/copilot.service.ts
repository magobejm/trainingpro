import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Type } from '@google/genai';
import { coachRoutineSchema } from '@trainerpro/shared';
import { z } from 'zod';
import type { AuthContext } from '../../common/auth-context/auth-context';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { resolveCoachMembership } from '../clients/infra/prisma/client.repository.prisma.ops';

const DAILY_CAP = 30;
const summarySchema = z.object({
  callTopics: z.array(z.string().max(200)).max(6),
  headline: z.string().max(200),
  mood: z.string().max(300),
  nutrition: z.string().max(300),
  stalls: z.array(z.string().max(200)).max(6),
  wins: z.array(z.string().max(200)).max(6),
});

@Injectable()
export class CopilotService {
  constructor(
    private readonly gemini: GeminiService,
    private readonly prisma: PrismaService,
  ) {}

  async routineDraft(
    context: AuthContext,
    input: { clientId: string; daysPerWeek: number; goal: string; sessionMinutes: number },
  ) {
    const membership = await this.consume(context);
    const client = await this.ownedClient(membership.id, input.clientId);
    const exercises = await this.prisma.exercise.findMany({
      select: { equipment: true, id: true, name: true },
      take: 80,
      where: { archivedAt: null, coachMembershipId: membership.id },
    });
    const raw = await this.ask(
      'Redacta un borrador de rutina JSON. Usa solo exerciseLibraryId de este catálogo. No inventes ids. ' +
        `Objetivo: ${input.goal}. Días: ${input.daysPerWeek}. Minutos: ${input.sessionMinutes}. ` +
        `Lesiones: ${client.injuries ?? 'ninguna'}. Alergias: ${client.allergies ?? 'ninguna'}. ` +
        `Consideraciones: ${client.considerations ?? 'ninguna'}. Material: ${(client.equipment ?? []).join(', ') || 'no indicado'}. ` +
        `Catálogo: ${JSON.stringify(exercises)}.`,
      { properties: { days: { type: Type.ARRAY }, name: { type: Type.STRING } }, type: Type.OBJECT },
    );
    const repaired = repairRoutine(
      raw,
      exercises.map((item) => item.id),
    );
    const parsed = coachRoutineSchema.safeParse(repaired);
    if (!parsed.success) throw new BadRequestException('El borrador no encaja en el planificador');
    return parsed.data;
  }

  async weeklySummary(context: AuthContext, input: { clientId: string; weekStart: string }) {
    const membership = await this.consume(context);
    await this.ownedClient(membership.id, input.clientId);
    const start = new Date(`${input.weekStart}T00:00:00.000Z`);
    const [sessions, checkins, incidents] = await Promise.all([
      this.prisma.sessionInstance.count({
        where: { archivedAt: null, clientId: input.clientId, finishedAt: { gte: start }, isCompleted: true },
      }),
      this.prisma.dailyCheckin.findMany({ where: { clientId: input.clientId, date: { gte: start } } }),
      this.prisma.incident.count({ where: { archivedAt: null, clientId: input.clientId, status: 'OPEN' } }),
    ]);
    const mood = checkins.length ? Math.round(checkins.reduce((sum, row) => sum + row.recovery, 0) / checkins.length) : null;
    const facts = {
      checkins: checkins.length,
      incidents,
      moodRecovery: mood,
      sessionsCompleted: sessions,
      weekStart: input.weekStart,
    };
    const raw = await this.ask(
      'Redacta un pre-resumen semanal para la llamada del coach. No calcules métricas: usa solo estos datos ya calculados. ' +
        JSON.stringify(facts),
      {
        properties: {
          callTopics: { items: { type: Type.STRING }, type: Type.ARRAY },
          headline: { type: Type.STRING },
          mood: { type: Type.STRING },
          nutrition: { type: Type.STRING },
          stalls: { items: { type: Type.STRING }, type: Type.ARRAY },
          wins: { items: { type: Type.STRING }, type: Type.ARRAY },
        },
        type: Type.OBJECT,
      },
    );
    const parsed = summarySchema.safeParse(raw);
    if (!parsed.success) throw new BadRequestException('El resumen no tiene el formato esperado');
    return { ...parsed.data, facts };
  }

  async nutritionDraft(context: AuthContext, input: { clientId: string }) {
    const membership = await this.consume(context);
    const client = await this.ownedClient(membership.id, input.clientId);
    const foods = await this.prisma.food.findMany({
      select: { id: true, name: true },
      take: 40,
      where: { coachMembershipId: membership.id },
    });
    const raw = await this.ask(
      'Propón un menú semanal en una nota breve. Usa solo alimentos de esta lista y excluye alérgenos. No inventes ids. ' +
        `Alergias: ${client.allergies ?? 'ninguna'}. Alimentos: ${JSON.stringify(foods)}.`,
      { properties: { note: { type: Type.STRING } }, type: Type.OBJECT },
    );
    const parsed = z.object({ note: z.string().max(2000) }).safeParse(raw);
    if (!parsed.success) throw new BadRequestException('El menú no tiene el formato esperado');
    return parsed.data;
  }

  private async consume(context: AuthContext) {
    if (!this.gemini.isConfigured()) {
      throw new ServiceUnavailableException('El copilot no está disponible. Puedes intentarlo de nuevo.');
    }
    const membership = await resolveCoachMembership(context, this.prisma);
    const day = new Date();
    const date = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
    const usage = await this.prisma.copilotUsage.upsert({
      create: { coachMembershipId: membership.id, count: 1, day: date },
      update: { count: { increment: 1 } },
      where: { coachMembershipId_day: { coachMembershipId: membership.id, day: date } },
    });
    if (usage.count > DAILY_CAP) throw new BadRequestException('Has alcanzado el límite diario del copilot');
    return membership;
  }

  private async ask(text: string, schema: unknown) {
    try {
      return await this.gemini.generateJson({ parts: [{ text }], schema, timeoutMs: 30_000 });
    } catch {
      throw new ServiceUnavailableException('El copilot no está disponible. Puedes intentarlo de nuevo.');
    }
  }

  private async ownedClient(coachMembershipId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({ where: { archivedAt: null, coachMembershipId, id: clientId } });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }
}

function repairRoutine(raw: unknown, allowedIds: string[]) {
  if (!raw || typeof raw !== 'object') return raw;
  const body = raw as { days?: Array<{ exercises?: Array<Record<string, unknown>>; title?: string }>; name?: string };
  const allowed = new Set(allowedIds);
  const days = (body.days ?? []).flatMap((day, index) => {
    const exercises = (day.exercises ?? []).flatMap((exercise) => {
      const libraryId = typeof exercise.exerciseLibraryId === 'string' ? exercise.exerciseLibraryId : null;
      if (libraryId && !allowed.has(libraryId)) return [];
      return [{ ...exercise, fieldModes: [{ fieldKey: 'reps', mode: 'COACH_INPUT' }], sortOrder: 0 }];
    });
    if (exercises.length === 0) return [];
    return [{ ...day, dayIndex: index + 1, exercises, title: day.title || `Día ${index + 1}` }];
  });
  return { ...body, days, name: body.name || 'Borrador IA' };
}
