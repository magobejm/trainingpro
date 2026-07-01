import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TOKEN_VERIFIER } from '../../src/modules/auth/domain/token-verifier.token';
import { LIBRARY_REPOSITORY } from '../../src/modules/library/domain/library-repository.port';

describe('Library exercise delete routine usage', () => {
  async function bootstrap(repository: ReturnType<typeof createRepository>) {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TOKEN_VERIFIER)
      .useValue({
        verify: async () => ({
          email: 'coach-a@fitcoach.local',
          roles: ['coach'],
          subject: 'coach-a',
        }),
      })
      .overrideProvider(LIBRARY_REPOSITORY)
      .useValue(repository)
      .compile();

    const app = moduleRef.createNestApplication();
    await app.init();
    return app;
  }

  it('returns 400 when exercise is used in a routine template', async () => {
    const app = await bootstrap(createRepository(true));
    await request(app.getHttpServer())
      .delete('/library/exercises/exercise-in-routine')
      .set('Authorization', 'Bearer coach-a')
      .set('x-active-role', 'coach')
      .expect(400)
      .expect(({ body }) => {
        expect(body.message).toContain('routine template');
      });
    await app.close();
  });

  it('returns 200 when exercise is not used in routines', async () => {
    const app = await bootstrap(createRepository(false));
    await request(app.getHttpServer())
      .delete('/library/exercises/exercise-free')
      .set('Authorization', 'Bearer coach-a')
      .set('x-active-role', 'coach')
      .expect(200);
    await app.close();
  });
});

function createRepository(inUse: boolean) {
  return {
    deleteExercise: async (_context: { subject: string }, itemId: string) => {
      if (inUse && itemId === 'exercise-in-routine') {
        const { BadRequestException } = await import('@nestjs/common');
        throw new BadRequestException('Library item is used in a routine template');
      }
    },
    listExercises: async () => [],
    createExercise: async () => {
      throw new Error('not used');
    },
    updateExercise: async () => {
      throw new Error('not used');
    },
    deleteCardioMethod: async () => {},
    listCardioMethods: async () => [],
    createCardioMethod: async () => {
      throw new Error('not used');
    },
    updateCardioMethod: async () => {
      throw new Error('not used');
    },
    listCardioMethodTypes: async () => [],
    listExerciseMuscleGroups: async () => [],
    listFoods: async () => [],
    createFood: async () => {
      throw new Error('not used');
    },
    updateFood: async () => {
      throw new Error('not used');
    },
    deleteFood: async () => {},
    listIsometricExercises: async () => [],
    createIsometricExercise: async () => {
      throw new Error('not used');
    },
    updateIsometricExercise: async () => {
      throw new Error('not used');
    },
    deleteIsometricExercise: async () => {},
    listIsometricTypes: async () => [],
    listPlioExercises: async () => [],
    createPlioExercise: async () => {
      throw new Error('not used');
    },
    updatePlioExercise: async () => {
      throw new Error('not used');
    },
    deletePlioExercise: async () => {},
    listPlioTypes: async () => [],
    listMobilityExercises: async () => [],
    createMobilityExercise: async () => {
      throw new Error('not used');
    },
    updateMobilityExercise: async () => {
      throw new Error('not used');
    },
    deleteMobilityExercise: async () => {},
    listMobilityTypes: async () => [],
    listSports: async () => [],
    createSport: async () => {
      throw new Error('not used');
    },
    updateSport: async () => {
      throw new Error('not used');
    },
    deleteSport: async () => {},
  };
}
