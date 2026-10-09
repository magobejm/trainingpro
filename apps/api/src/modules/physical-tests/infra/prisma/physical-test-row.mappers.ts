import { Prisma } from '@prisma/client';
import type { TestInputs } from '../../domain/evaluate-test';
import type {
  ClientPhysicalTestAssignmentView,
  ClientPhysicalTestScheduleView,
  CoachPhysicalTestScheduleView,
  PhysicalTestResultView,
  PhysicalTestScheduleSummary,
  PhysicalTestView,
} from '../../domain/physical-test.entity';
import { formatDateOnly } from '../../domain/schedule-physical-test';

type PhysicalTestRow = {
  id: string;
  code: string;
  category: string;
  name: string;
  level: string;
  objective: string;
  whatToDo: string;
  whatToMeasure: string;
  options: Prisma.JsonValue;
  normTables: Prisma.JsonValue;
  sortOrder: number;
};

type ResultRow = {
  id: string;
  clientId: string;
  physicalTestId: string;
  inputsJson: Prisma.JsonValue;
  rawScore: string;
  classification: string;
  classificationColor: string | null;
  measuredAt: Date;
};

export function mapPhysicalTest(row: PhysicalTestRow): PhysicalTestView {
  const options = row.options as { economic: string; pro: string } | null;
  return {
    id: row.id,
    code: row.code,
    category: row.category,
    name: row.name,
    level: row.level,
    objective: row.objective,
    whatToDo: row.whatToDo,
    whatToMeasure: row.whatToMeasure,
    options,
    normTables: row.normTables,
    sortOrder: row.sortOrder,
  };
}

export function mapAssignment(
  row: {
    assignedAt: Date;
    clientId: string;
    id: string;
    physicalTest: PhysicalTestRow;
    physicalTestId: string;
    results: ResultRow[];
  },
  schedules: Array<{ id: string; physicalTestId: string; resultId: string | null; scheduledDate: Date }>,
): ClientPhysicalTestAssignmentView {
  const results = row.results.map(mapResult);
  return {
    assignedAt: row.assignedAt.toISOString(),
    clientId: row.clientId,
    id: row.id,
    latestResult: results[0] ?? null,
    physicalTest: mapPhysicalTest(row.physicalTest),
    physicalTestId: row.physicalTestId,
    results,
    schedules: schedules.filter((item) => item.physicalTestId === row.physicalTestId).map(mapScheduleSummary),
  };
}

export function mapCoachSchedule(row: {
  id: string;
  physicalTest: { id: string; name: string };
  physicalTestId: string;
  result: ResultRow | null;
  scheduledDate: Date;
}): CoachPhysicalTestScheduleView {
  return {
    done: row.result != null,
    id: row.id,
    physicalTestId: row.physicalTestId,
    physicalTestName: row.physicalTest.name,
    result: row.result ? mapResult(row.result) : null,
    scheduledDate: formatDateOnly(row.scheduledDate),
  };
}

export function mapClientSchedule(row: {
  id: string;
  physicalTest: PhysicalTestRow;
  result: ResultRow | null;
  scheduledDate: Date;
}): ClientPhysicalTestScheduleView {
  const source = mapPhysicalTest(row.physicalTest);
  return {
    id: row.id,
    physicalTest: {
      category: source.category,
      code: source.code,
      id: source.id,
      level: source.level,
      name: source.name,
      objective: source.objective,
      options: source.options,
      sortOrder: source.sortOrder,
      whatToDo: source.whatToDo,
      whatToMeasure: source.whatToMeasure,
    },
    result: row.result ? mapResult(row.result) : null,
    scheduledDate: formatDateOnly(row.scheduledDate),
  };
}

type ScheduleWithTest = {
  id: string;
  physicalTest: PhysicalTestRow;
  physicalTestId: string;
  resultId: string | null;
  scheduledDate: Date;
};

/** Una programación sin fila de asignación sigue viéndose en la ficha y en la app. */
export function mapUnassignedSchedules(clientId: string, schedules: ScheduleWithTest[]): ClientPhysicalTestAssignmentView[] {
  const byTest = new Map<string, ScheduleWithTest[]>();
  for (const schedule of schedules) {
    const group = byTest.get(schedule.physicalTestId) ?? [];
    group.push(schedule);
    byTest.set(schedule.physicalTestId, group);
  }
  return [...byTest.values()].flatMap((group) => {
    const first = group[0];
    if (!first) return [];
    return [
      {
        assignedAt: first.scheduledDate.toISOString(),
        clientId,
        id: first.id,
        latestResult: null,
        physicalTest: mapPhysicalTest(first.physicalTest),
        physicalTestId: first.physicalTestId,
        results: [],
        schedules: group.map(mapScheduleSummary),
      },
    ];
  });
}

function mapScheduleSummary(row: { id: string; resultId: string | null; scheduledDate: Date }): PhysicalTestScheduleSummary {
  return {
    done: row.resultId != null,
    id: row.id,
    resultId: row.resultId,
    scheduledDate: formatDateOnly(row.scheduledDate),
  };
}

export function mapResult(row: ResultRow): PhysicalTestResultView {
  return {
    id: row.id,
    clientId: row.clientId,
    physicalTestId: row.physicalTestId,
    inputsJson: row.inputsJson as unknown as TestInputs,
    rawScore: row.rawScore,
    classification: row.classification,
    classificationColor: row.classificationColor,
    measuredAt: row.measuredAt.toISOString(),
  };
}
