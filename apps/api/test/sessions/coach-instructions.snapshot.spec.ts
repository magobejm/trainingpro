import { mapCardioTemplateBlockSnapshot } from '../../src/modules/sessions/infra/prisma/sessions-cardio.prisma.helpers';
import {
  mapTemplateExerciseSnapshot,
  mapTemplateIsometricSnapshot,
  mapTemplateMobilitySnapshot,
  mapTemplatePlioSnapshot,
  mapTemplateSportSnapshot,
} from '../../src/modules/sessions/infra/prisma/sessions-prisma.mappers';

const TECHNICAL = 'descripcion-tecnica';
const COACH = 'indicacion';
const NOTE = 'nota del bloque';

function library() {
  return { coachInstructions: COACH, description: TECHNICAL };
}

function expectSessionText(snapshot: { coachInstructions: null | string; notes: null | string }) {
  expect(snapshot.coachInstructions).toBe(COACH);
  expect(snapshot.notes).toBe(NOTE);
  expect(JSON.stringify(snapshot)).not.toContain(TECHNICAL);
}

describe('session coach instructions', () => {
  it('copies library coach instructions and the block note, not the technical description', () => {
    expectSessionText(
      mapTemplateExerciseSnapshot({
        displayName: 'Press',
        exerciseLibraryId: 'lib-1',
        libraryExercise: library(),
        notes: NOTE,
        perSetWeightRangesJson: null,
        repsMax: null,
        repsMin: null,
        restSeconds: null,
        sets: [],
        setsPlanned: null,
        sortOrder: 0,
        targetRir: null,
        targetRpe: null,
        weightRangeMaxKg: null,
        weightRangeMinKg: null,
      }),
    );
    expectSessionText(
      mapTemplatePlioSnapshot({
        displayName: 'Salto',
        libraryPlioExercise: library(),
        notes: NOTE,
        plioExerciseLibraryId: 'lib-1',
        restSeconds: 10,
        roundsPlanned: 1,
        sets: [],
        sortOrder: 0,
        targetRpe: null,
        workSeconds: 20,
      }),
    );
    expectSessionText(
      mapTemplateMobilitySnapshot({
        displayName: 'Cadera',
        libraryMobilityExercise: library(),
        mobilityExerciseLibraryId: 'lib-1',
        notes: NOTE,
        restSeconds: 10,
        roundsPlanned: 1,
        sets: [],
        sortOrder: 0,
        targetRpe: null,
        workSeconds: 20,
      }),
    );
    expectSessionText(
      mapTemplateIsometricSnapshot({
        displayName: 'Plancha',
        isometricExerciseLibraryId: 'lib-1',
        libraryIsometricExercise: library(),
        notes: NOTE,
        restSeconds: 30,
        sets: [],
        setsPlanned: 1,
        sortOrder: 0,
        targetRpe: null,
      }),
    );
    expectSessionText(
      mapTemplateSportSnapshot({
        displayName: 'Remo',
        durationMinutes: 20,
        librarySport: library(),
        notes: NOTE,
        sets: [],
        sortOrder: 0,
        sportLibraryId: 'lib-1',
        targetRpe: null,
      }),
    );
    expectSessionText(
      mapCardioTemplateBlockSnapshot({
        cardioMethodLibraryId: 'lib-1',
        displayName: 'Intervalos',
        id: 'block-1',
        libraryCardioMethod: library(),
        notes: NOTE,
        restSeconds: 30,
        roundsPlanned: 1,
        sets: [],
        sortOrder: 0,
        targetDistanceMeters: null,
        targetRpe: null,
        workSeconds: 60,
      }),
    );
  });
});
