import { LibraryUnifiedService, type UnifiedCategory } from '../../src/modules/library/application/library-unified.service';

const TECHNICAL = 'descripcion-tecnica';
const COACH = 'indicacion';
const EDITED_TECHNICAL = 'descripcion-editada';
const EDITED_COACH = 'indicacion-editada';
const WRONG_COLUMN = 'columna-equivocada';

type LibraryModel = {
  create: jest.Mock;
  findMany: jest.Mock;
  update: jest.Mock;
};

type CategoryCase = {
  category: UnifiedCategory;
  column: 'description' | 'instructions';
  extra: Record<string, string>;
  listCategory: string;
  model: string;
};

const CASES: CategoryCase[] = [
  { category: 'strength', column: 'instructions', extra: {}, listCategory: 'muscleGroups', model: 'exercise' },
  {
    category: 'cardio',
    column: 'description',
    extra: { cardioTypeId: 'type-1' },
    listCategory: 'cardioMethodTypes',
    model: 'cardioMethod',
  },
  {
    category: 'plio',
    column: 'description',
    extra: { plioTypeId: 'type-1' },
    listCategory: 'plioTypes',
    model: 'plioExercise',
  },
  {
    category: 'warmup',
    column: 'description',
    extra: { mobilityTypeId: 'type-1' },
    listCategory: 'mobilityTypes',
    model: 'mobilityExercise',
  },
  {
    category: 'isometric',
    column: 'description',
    extra: { isometricTypeId: 'type-1' },
    listCategory: 'isometricTypes',
    model: 'isometricExercise',
  },
  {
    category: 'sport',
    column: 'description',
    extra: { sportTypeId: 'type-1' },
    listCategory: 'sportTypes',
    model: 'sport',
  },
];

function libraryModels(): Record<string, LibraryModel> {
  const names = ['exercise', 'cardioMethod', 'plioExercise', 'mobilityExercise', 'isometricExercise', 'sport'];
  return Object.fromEntries(
    names.map((name) => [
      name,
      {
        create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => data),
        findMany: jest.fn(async () => [listRow()]),
        update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => data),
      },
    ]),
  );
}

function listRow(): Record<string, unknown> {
  return {
    anatomicalPlaneRef: null,
    coachInstructions: COACH,
    description: TECHNICAL,
    equipmentRef: null,
    id: 'item-1',
    instructions: WRONG_COLUMN,
    isometricTypeRef: null,
    mediaUrl: null,
    methodTypeRef: { label: 'HIIT' },
    mobilityTypeRefRel: null,
    movementPatternRef: null,
    muscleGroups: [],
    name: 'Press',
    plioTypeRef: null,
    scope: 'COACH',
    sportTypeRef: null,
    youtubeUrl: null,
  };
}

function createService(models: Record<string, LibraryModel>): LibraryUnifiedService {
  return new LibraryUnifiedService(
    {
      ...models,
      exerciseMuscleGroupAssignment: { deleteMany: async () => ({ count: 0 }) },
      organizationMember: { findFirst: async () => ({ id: 'mem-1', organizationId: 'org-1' }) },
    } as never,
    {} as never,
  );
}

function expectStoredApart(data: Record<string, unknown>, column: CategoryCase['column'], technical: string, coach: string) {
  expect(data[column]).toBe(technical);
  expect(data.coachInstructions).toBe(coach);
  expect(data[column === 'instructions' ? 'description' : 'instructions']).toBeUndefined();
}

describe('unified library instructions', () => {
  it.each(CASES)('keeps description and coach instructions apart for $category', async (entry) => {
    const models = libraryModels();
    const service = createService(models);
    const model = models[entry.model];
    if (!model) throw new Error(`Missing model ${entry.model}`);

    await service.createUnifiedItem(
      { category: entry.category, name: 'Press', instructions: TECHNICAL, coachInstructions: COACH, ...entry.extra },
      'coach-subject',
    );
    expectStoredApart(model.create.mock.calls[0][0].data, entry.column, TECHNICAL, COACH);

    await service.updateUnifiedItem(
      'item-1',
      {
        category: entry.category,
        name: 'Press',
        instructions: EDITED_TECHNICAL,
        coachInstructions: EDITED_COACH,
        ...entry.extra,
      },
      'coach-subject',
    );
    expectStoredApart(model.update.mock.calls[0][0].data, entry.column, EDITED_TECHNICAL, EDITED_COACH);

    const row = listRow();
    if (entry.category === 'strength') row.instructions = TECHNICAL;
    model.findMany.mockResolvedValue([row]);
    const listed = await service.listAllExercises('coach-subject', { baseCategory: entry.listCategory });
    expect(listed.items).toEqual([
      expect.objectContaining({
        coachInstructions: COACH,
        instructions: TECHNICAL,
      }),
    ]);
    expect(JSON.stringify(listed.items[0])).not.toContain(WRONG_COLUMN);
  });
});
