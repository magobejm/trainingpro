import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';
import { CreateCardioMethodUseCase } from './application/use-cases/create-cardio-method.usecase';
import { CreateExerciseUseCase } from './application/use-cases/create-exercise.usecase';
import { CreateFoodUseCase } from './application/use-cases/create-food.usecase';
import { CreatePlioExerciseUseCase } from './application/use-cases/create-plio-exercise.usecase';
import { CreateWarmupExerciseUseCase } from './application/use-cases/create-warmup-exercise.usecase';
import { CreateSportUseCase } from './application/use-cases/create-sport.usecase';
import { DeleteCardioMethodUseCase } from './application/use-cases/delete-cardio-method.usecase';
import { DeleteExerciseUseCase } from './application/use-cases/delete-exercise.usecase';
import { DeleteFoodUseCase } from './application/use-cases/delete-food.usecase';
import { DeletePlioExerciseUseCase } from './application/use-cases/delete-plio-exercise.usecase';
import { DeleteWarmupExerciseUseCase } from './application/use-cases/delete-warmup-exercise.usecase';
import { DeleteSportUseCase } from './application/use-cases/delete-sport.usecase';
import { ListCardioMethodTypesUseCase } from './application/use-cases/list-cardio-method-types.usecase';
import { ListCardioMethodsUseCase } from './application/use-cases/list-cardio-methods.usecase';
import { ListExerciseMuscleGroupsUseCase } from './application/use-cases/list-exercise-muscle-groups.usecase';
import { ListExercisesUseCase } from './application/use-cases/list-exercises.usecase';
import { ListFoodsUseCase } from './application/use-cases/list-foods.usecase';
import { ListPlioExercisesUseCase } from './application/use-cases/list-plio-exercises.usecase';
import { ListWarmupExercisesUseCase } from './application/use-cases/list-warmup-exercises.usecase';
import { ListSportsUseCase } from './application/use-cases/list-sports.usecase';
import { UpdateCardioMethodUseCase } from './application/use-cases/update-cardio-method.usecase';
import { UpdateExerciseUseCase } from './application/use-cases/update-exercise.usecase';
import { UpdateFoodUseCase } from './application/use-cases/update-food.usecase';
import { UpdatePlioExerciseUseCase } from './application/use-cases/update-plio-exercise.usecase';
import { UpdateWarmupExerciseUseCase } from './application/use-cases/update-warmup-exercise.usecase';
import { UpdateSportUseCase } from './application/use-cases/update-sport.usecase';
import { UploadLibraryMediaImageUseCase } from './application/use-cases/upload-library-media-image.usecase';
import { LIBRARY_REPOSITORY } from './domain/library-repository.port';
import { LibraryEditPolicy } from './domain/policies/library-edit.policy';
import { LibraryRepositoryPrisma } from './infra/prisma/library.repository.prisma';
import { LibraryFoodRepository } from './infra/prisma/library-food.repository';
import { LibrarySpecializedRepository } from './infra/prisma/library-specialized.repository';
import { LibraryController } from './presentation/controllers/library.controller';
import { LibraryFoodController } from './presentation/controllers/library-food.controller';
import { LibrarySpecializedController } from './presentation/controllers/library-specialized.controller';
import { LibraryMediaController } from './presentation/controllers/library-media.controller';

@Module({
  imports: [AuthModule, FilesModule],
  controllers: [
    LibraryController,
    LibraryFoodController,
    LibrarySpecializedController,
    LibraryMediaController,
  ],
  providers: [
    CreateCardioMethodUseCase,
    CreateExerciseUseCase,
    CreateFoodUseCase,
    CreatePlioExerciseUseCase,
    CreateWarmupExerciseUseCase,
    CreateSportUseCase,
    DeleteCardioMethodUseCase,
    DeleteExerciseUseCase,
    DeleteFoodUseCase,
    DeletePlioExerciseUseCase,
    DeleteWarmupExerciseUseCase,
    DeleteSportUseCase,
    ListCardioMethodTypesUseCase,
    ListCardioMethodsUseCase,
    ListExerciseMuscleGroupsUseCase,
    ListExercisesUseCase,
    ListFoodsUseCase,
    ListPlioExercisesUseCase,
    ListWarmupExercisesUseCase,
    ListSportsUseCase,
    UpdateCardioMethodUseCase,
    UpdateExerciseUseCase,
    UpdateFoodUseCase,
    UpdatePlioExerciseUseCase,
    UpdateWarmupExerciseUseCase,
    UpdateSportUseCase,
    UploadLibraryMediaImageUseCase,
    LibraryEditPolicy,
    LibraryFoodRepository,
    LibrarySpecializedRepository,
    LibraryRepositoryPrisma,
    {
      provide: LIBRARY_REPOSITORY,
      useExisting: LibraryRepositoryPrisma,
    },
  ],
})
export class LibraryModule {}
