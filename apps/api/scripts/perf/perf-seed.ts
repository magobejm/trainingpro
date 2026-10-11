/* eslint-disable no-console */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';
import {
  PERF_COACH_EMAIL,
  PERF_COACH_MEMBER_ID,
  PERF_COACH_UID,
  PERF_COACH_USER_ID,
  PERF_ORG_ID,
  PERF_OTHER_EMAIL,
  PERF_OTHER_MEMBER_ID,
  PERF_OTHER_UID,
  PERF_OTHER_USER_ID,
  readVolume,
  type PerfVolume,
} from './perf-config';
import { removePerfOrganization } from './perf-teardown';

const prisma = new PrismaClient();
const org = PERF_ORG_ID;

async function main(): Promise<void> {
  const volume = readVolume();
  await removePerfOrganization(prisma);
  await seedOrganization(volume.clients);
  await seedLibrary(volume);
  const templateId = await seedPlans(volume);
  const clientId = await seedClients(volume);
  await seedSessions(volume, templateId);
  const threadId = await seedChat(volume, clientId);
  const exerciseId = await firstExerciseId();
  writeManifest({ clientId, exerciseId, templateId, threadId, volume });
  console.log(`Organización perf lista: ${volume.clients} clientes, plantilla ${templateId}.`);
}

async function seedOrganization(clients: number): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO organization (id, name, created_at, updated_at)
    VALUES (${org}::uuid, 'perf', now(), now())
  `;
  await prisma.$executeRaw`
    INSERT INTO organization_subscription (id, organization_id, client_limit, active_client_count, created_at, updated_at)
    VALUES (gen_random_uuid(), ${org}::uuid, ${clients + 20}, ${clients}, now(), now())
  `;
  await insertUser(PERF_COACH_USER_ID, PERF_COACH_EMAIL, PERF_COACH_UID);
  await insertUser(PERF_OTHER_USER_ID, PERF_OTHER_EMAIL, PERF_OTHER_UID);
  await insertMember(PERF_COACH_MEMBER_ID, PERF_COACH_USER_ID);
  await insertMember(PERF_OTHER_MEMBER_ID, PERF_OTHER_USER_ID);
}

async function insertUser(id: string, email: string, uid: string): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO user_account (id, email, supabase_uid, is_active, created_at, updated_at)
    VALUES (${id}::uuid, ${email}, ${uid}::uuid, true, now(), now())
  `;
}

async function insertMember(id: string, userId: string): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO organization_member (id, organization_id, user_id, role, is_active, created_at, updated_at)
    VALUES (${id}::uuid, ${org}::uuid, ${userId}::uuid, 'COACH'::"Role", true, now(), now())
  `;
}

async function seedLibrary(volume: PerfVolume): Promise<void> {
  const methodType = await prisma.$queryRaw<Array<{ id: string }>>`SELECT id FROM cardio_method_type LIMIT 1`;
  const methodTypeId = methodType[0]?.id;
  if (!methodTypeId) throw new Error('Falta el catálogo de tipos de cardio. Ejecuta el seed de biblioteca antes.');
  const objective = await prisma.$queryRaw<Array<{ id: string }>>`SELECT id FROM client_objective LIMIT 1`;
  if (!objective[0]?.id) throw new Error('Falta el catálogo de objetivos. Ejecuta el seed de biblioteca antes.');
  for (const member of [PERF_COACH_MEMBER_ID, PERF_OTHER_MEMBER_ID]) {
    await insertLibrary(member, volume.libraryPerType, methodTypeId);
  }
}

async function insertLibrary(member: string, count: number, methodTypeId: string): Promise<void> {
  const user = member === PERF_COACH_MEMBER_ID ? PERF_COACH_USER_ID : PERF_OTHER_USER_ID;
  await prisma.$executeRaw`
    INSERT INTO exercise (
      id, scope, organization_id, coach_membership_id, name, created_by, updated_by, created_at, updated_at
    )
    SELECT gen_random_uuid(), 'COACH'::"LibraryItemScope", ${org}::uuid, ${member}::uuid,
           ${member} || ' ejercicio ' || g, ${user}::uuid, ${user}::uuid, now(), now()
    FROM generate_series(1, ${count}) g
  `;
  await prisma.$executeRaw`
    INSERT INTO food (
      id, scope, organization_id, coach_membership_id, name, food_category,
      created_by, updated_by, created_at, updated_at
    )
    SELECT gen_random_uuid(), 'COACH'::"LibraryItemScope", ${org}::uuid, ${member}::uuid,
           ${member} || ' alimento ' || g, 'perf', ${user}::uuid, ${user}::uuid, now(), now()
    FROM generate_series(1, ${count}) g
  `;
  await prisma.$executeRaw`
    INSERT INTO cardio_method (
      id, scope, organization_id, coach_membership_id, name, method_type_id,
      created_by, updated_by, created_at, updated_at
    )
    SELECT gen_random_uuid(), 'COACH'::"LibraryItemScope", ${org}::uuid, ${member}::uuid,
           ${member} || ' cardio ' || g, ${methodTypeId}::uuid, ${user}::uuid, ${user}::uuid, now(), now()
    FROM generate_series(1, ${count}) g
  `;
  await prisma.$executeRaw`
    INSERT INTO plio_exercise (id, scope, organization_id, coach_membership_id, name, created_at, updated_at)
    SELECT gen_random_uuid(), 'COACH'::"LibraryItemScope", ${org}::uuid, ${member}::uuid,
           ${member} || ' plio ' || g, now(), now()
    FROM generate_series(1, ${count}) g
  `;
  await prisma.$executeRaw`
    INSERT INTO mobility_exercise (id, scope, organization_id, coach_membership_id, name, created_at, updated_at)
    SELECT gen_random_uuid(), 'COACH'::"LibraryItemScope", ${org}::uuid, ${member}::uuid,
           ${member} || ' movilidad ' || g, now(), now()
    FROM generate_series(1, ${count}) g
  `;
  await prisma.$executeRaw`
    INSERT INTO isometric_exercise (id, scope, organization_id, coach_membership_id, name, created_at, updated_at)
    SELECT gen_random_uuid(), 'COACH'::"LibraryItemScope", ${org}::uuid, ${member}::uuid,
           ${member} || ' isometrico ' || g, now(), now()
    FROM generate_series(1, ${count}) g
  `;
  await prisma.$executeRaw`
    INSERT INTO sport (id, scope, organization_id, coach_membership_id, name, icon, created_at, updated_at)
    SELECT gen_random_uuid(), 'COACH'::"LibraryItemScope", ${org}::uuid, ${member}::uuid,
           ${member} || ' deporte ' || g, '•', now(), now()
    FROM generate_series(1, ${count}) g
  `;
}

async function seedPlans(volume: PerfVolume): Promise<string> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO plan_template (
      id, scope, organization_id, coach_membership_id, kind, name, template_version,
      created_by, updated_by, created_at, updated_at
    )
    SELECT gen_random_uuid(), 'COACH'::"LibraryItemScope", ${org}::uuid, ${PERF_COACH_MEMBER_ID}::uuid,
           'ROUTINE'::"TemplateKind",
           'Perf rutina ' || g, 1, ${PERF_COACH_USER_ID}::uuid, ${PERF_COACH_USER_ID}::uuid, now(), now()
    FROM generate_series(1, ${volume.routines}) g
    RETURNING id
  `;
  const templateId = rows[0]?.id;
  if (!templateId) throw new Error('No se creó ninguna rutina.');
  await prisma.$executeRaw`
    INSERT INTO plan_day (id, template_id, day_index, title, created_at, updated_at)
    SELECT gen_random_uuid(), t.id, d.day_index, 'Día ' || d.day_index, now(), now()
    FROM plan_template t
    CROSS JOIN (VALUES (0), (1)) AS d(day_index)
    WHERE t.organization_id = ${org}::uuid AND t.kind = 'ROUTINE'::"TemplateKind"
  `;
  await prisma.$executeRaw`
    INSERT INTO plan_strength_exercise (
      id, day_id, display_name, sort_order, sets_planned, reps_min, reps_max, created_at, updated_at
    )
    SELECT gen_random_uuid(), d.id, 'Bloque ' || s.sort_order, s.sort_order, 3, 6, 10, now(), now()
    FROM plan_day d
    JOIN plan_template t ON t.id = d.template_id
    CROSS JOIN (VALUES (0), (1), (2)) AS s(sort_order)
    WHERE t.organization_id = ${org}::uuid
  `;
  await prisma.$executeRaw`
    INSERT INTO plan_template (
      id, scope, organization_id, coach_membership_id, kind, name, template_version,
      created_by, updated_by, created_at, updated_at
    )
    SELECT gen_random_uuid(), 'COACH'::"LibraryItemScope", ${org}::uuid, ${PERF_COACH_MEMBER_ID}::uuid,
           'CARDIO'::"TemplateKind",
           'Perf cardio ' || g, 1, ${PERF_COACH_USER_ID}::uuid, ${PERF_COACH_USER_ID}::uuid, now(), now()
    FROM generate_series(1, 15) g
  `;
  await prisma.$executeRaw`
    INSERT INTO plan_day (id, template_id, day_index, title, created_at, updated_at)
    SELECT gen_random_uuid(), t.id, 0, 'Cardio', now(), now()
    FROM plan_template t
    WHERE t.organization_id = ${org}::uuid AND t.kind = 'CARDIO'::"TemplateKind"
  `;
  await prisma.$executeRaw`
    INSERT INTO plan_cardio_block (
      id, day_id, display_name, sort_order, rounds_planned, work_seconds, rest_seconds, created_at, updated_at
    )
    SELECT gen_random_uuid(), d.id, 'Bloque', 0, 4, 40, 20, now(), now()
    FROM plan_day d
    JOIN plan_template t ON t.id = d.template_id
    WHERE t.organization_id = ${org}::uuid AND t.kind = 'CARDIO'::"TemplateKind"
  `;
  await prisma.$executeRaw`
    INSERT INTO warmup_template (
      id, scope, organization_id, coach_membership_id, name, template_version,
      created_by, updated_by, created_at, updated_at
    )
    SELECT gen_random_uuid(), 'COACH'::"LibraryItemScope", ${org}::uuid, ${PERF_COACH_MEMBER_ID}::uuid,
           'Perf calentamiento ' || g, 1, ${PERF_COACH_USER_ID}::uuid, ${PERF_COACH_USER_ID}::uuid, now(), now()
    FROM generate_series(1, ${volume.warmups}) g
  `;
  await prisma.$executeRaw`
    INSERT INTO warmup_template_item (id, template_id, block_type, sort_order, display_name, created_at, updated_at)
    SELECT gen_random_uuid(), w.id, 'strength', s.sort_order, 'Item ' || s.sort_order, now(), now()
    FROM warmup_template w
    CROSS JOIN (VALUES (0), (1), (2), (3)) AS s(sort_order)
    WHERE w.organization_id = ${org}::uuid
  `;
  return templateId;
}

async function seedClients(volume: PerfVolume): Promise<string> {
  const objective = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM client_objective ORDER BY is_default DESC LIMIT 1
  `;
  const objectiveId = objective[0]?.id;
  if (!objectiveId) throw new Error('Falta un objetivo de cliente.');
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO client (
      id, organization_id, coach_membership_id, email, first_name, last_name, objective_id,
      created_by, updated_by, created_at, updated_at
    )
    SELECT gen_random_uuid(), ${org}::uuid, ${PERF_COACH_MEMBER_ID}::uuid,
           'perf-client-' || g || '@perf.local', 'Perf', 'Cliente ' || g, ${objectiveId}::uuid,
           ${PERF_COACH_USER_ID}::uuid, ${PERF_COACH_USER_ID}::uuid,
           now() - (g || ' minutes')::interval, now()
    FROM generate_series(1, ${volume.clients}) g
    ORDER BY g
    RETURNING id
  `;
  if (rows.length === 0) throw new Error('No se creó ningún cliente.');
  const selected = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM client WHERE organization_id = ${org}::uuid AND email = 'perf-client-1@perf.local'
  `;
  const clientId = selected[0]?.id;
  if (!clientId) throw new Error('No se encontró perf-client-1.');
  await prisma.$executeRaw`
    INSERT INTO client_progress_photo (id, client_id, image_url, created_at, updated_at)
    SELECT gen_random_uuid(), c.id, 'https://perf.local/p/' || g, now() - (g || ' days')::interval, now()
    FROM client c
    CROSS JOIN generate_series(1, ${volume.photos}) g
    WHERE c.organization_id = ${org}::uuid
  `;
  await prisma.$executeRaw`
    INSERT INTO calendar_event (id, coach_membership_id, client_id, type, date, title, created_at, updated_at)
    SELECT gen_random_uuid(), ${PERF_COACH_MEMBER_ID}::uuid, c.id, 'SESSION',
           (CURRENT_DATE - ((g * 14) * INTERVAL '1 day'))::date, 'Sesión', now(), now()
    FROM client c
    CROSS JOIN generate_series(0, ${volume.calendarEvents - 1}) g
    WHERE c.organization_id = ${org}::uuid
  `;
  return clientId;
}

async function seedSessions(volume: PerfVolume, templateId: string): Promise<void> {
  const perWeek = volume.sessionsPerWeek - 1;
  const weeks = volume.weeks - 1;
  await prisma.$executeRaw`
    INSERT INTO session_instance (
      id, organization_id, coach_membership_id, client_id, source_template_id, source_template_version,
      session_date, started_at, finished_at, is_completed, status, created_by, updated_by, created_at, updated_at
    )
    SELECT gen_random_uuid(), ${org}::uuid, ${PERF_COACH_MEMBER_ID}::uuid, c.id, ${templateId}::uuid, 1,
           (CURRENT_DATE - ((w * 7 + d) * INTERVAL '1 day'))::date,
           CURRENT_DATE - ((w * 7 + d) * INTERVAL '1 day'),
           CURRENT_DATE - ((w * 7 + d) * INTERVAL '1 day') + INTERVAL '1 hour',
           true, 'COMPLETED'::"SessionStatus", ${PERF_COACH_USER_ID}::uuid, ${PERF_COACH_USER_ID}::uuid, now(), now()
    FROM client c
    CROSS JOIN generate_series(0, ${weeks}) w
    CROSS JOIN generate_series(0, ${perWeek}) d
    WHERE c.organization_id = ${org}::uuid
  `;
  await prisma.$executeRaw`
    INSERT INTO session_strength_item (
      id, session_id, source_exercise_id, display_name, sort_order,
      sets_planned, reps_min, reps_max, created_at, updated_at
    )
    SELECT gen_random_uuid(), s.id, e.id, e.name, e.sort_order, 3, 6, 10, now(), now()
    FROM session_instance s
    JOIN LATERAL (
      SELECT id, name, (row_number() OVER (ORDER BY name) - 1)::int AS sort_order
      FROM exercise
      WHERE coach_membership_id = ${PERF_COACH_MEMBER_ID}::uuid AND archived_at IS NULL
      ORDER BY name
      LIMIT 4
    ) e ON true
    WHERE s.organization_id = ${org}::uuid
  `;
  await prisma.$executeRaw`
    INSERT INTO set_log (
      id, session_id, session_item_id, set_index, reps_done, weight_done_kg, effort_rpe, created_at, updated_at
    )
    SELECT gen_random_uuid(), i.session_id, i.id, g.set_index, 8,
           60 + (EXTRACT(doy FROM s.session_date)::int % 25), 8, now(), now()
    FROM session_strength_item i
    JOIN session_instance s ON s.id = i.session_id
    CROSS JOIN (VALUES (1), (2), (3)) AS g(set_index)
    WHERE s.organization_id = ${org}::uuid
  `;
}

async function seedChat(volume: PerfVolume, clientId: string): Promise<string> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO chat_thread (id, organization_id, coach_membership_id, client_id, created_at, updated_at)
    VALUES (gen_random_uuid(), ${org}::uuid, ${PERF_COACH_MEMBER_ID}::uuid, ${clientId}::uuid, now(), now())
    RETURNING id
  `;
  const threadId = rows[0]?.id;
  if (!threadId) throw new Error('No se creó el hilo de chat.');
  await prisma.$executeRaw`
    INSERT INTO chat_message (id, thread_id, sender_role, sender_subject, text, expires_at, created_at, updated_at)
    SELECT gen_random_uuid(), ${threadId}::uuid, 'COACH'::"ChatMessageSender", ${PERF_COACH_UID},
           'mensaje ' || g, now() + INTERVAL '5 years', now() - (g || ' minutes')::interval, now()
    FROM generate_series(1, ${volume.messages}) g
  `;
  return threadId;
}

async function firstExerciseId(): Promise<string> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM exercise
    WHERE coach_membership_id = ${PERF_COACH_MEMBER_ID}::uuid AND archived_at IS NULL
    ORDER BY name
    LIMIT 1
  `;
  const id = rows[0]?.id;
  if (!id) throw new Error('No hay ejercicios de perf.');
  return id;
}

function writeManifest(input: {
  clientId: string;
  exerciseId: string;
  templateId: string;
  threadId: string;
  volume: PerfVolume;
}): void {
  const dir = join(__dirname, '../../../../.run/perf');
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'manifest.json'),
    JSON.stringify(
      {
        clientId: input.clientId,
        coachEmail: PERF_COACH_EMAIL,
        coachSubject: PERF_COACH_UID,
        exerciseId: input.exerciseId,
        otherSubject: PERF_OTHER_UID,
        templateId: input.templateId,
        threadId: input.threadId,
        volume: input.volume,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'perf-seed failed';
    console.error(message.replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted]'));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
