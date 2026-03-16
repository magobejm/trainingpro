import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';
import { CreateIsometricExerciseUseCase } from './application/use-cases/create-isometric-exercise.usecase';
import { CreateCardioMethodUseCase } from './application/use-cases/create-cardio-method.usecase';
import { CreateExerciseUseCase } from './application/use-cases/create-exercise.usecase';
import { CreateFoodUseCase } from './application/use-cases/create-food.usecase';
import { CreatePlioExerciseUseCase } from './application/use-cases/create-plio-exercise.usecase';
import { CreateMobilityExerciseUseCase } from './application/use-cases/create-mobility-exercise.usecase';
import { CreateSportUseCase } from './application/use-cases/create-sport.usecase';
import { DeleteIsometricExerciseUseCase } from './application/use-cases/delete-isometric-exercise.usecase';
import { DeleteCardioMethodUseCase } from './application/use-cases/delete-cardio-method.usecase';
import { DeleteExerciseUseCase } from './application/use-cases/delete-exercise.usecase';
import { DeleteFoodUseCase } from './application/use-cases/delete-food.usecase';
import { DeletePlioExerciseUseCase } from './application/use-cases/delete-plio-exercise.usecase';
import { DeleteMobilityExerciseUseCase } from './application/use-cases/delete-mobility-exercise.usecase';
import { DeleteSportUseCase } from './application/use-cases/delete-sport.usecase';
import { ListIsometricExercisesUseCase } from './application/use-cases/list-isometric-exercises.usecase';
import { ListIsometricTypesUseCase } from './application/use-cases/list-isometric-types.usecase';
import { ListCardioMethodTypesUseCase } from './application/use-cases/list-cardio-method-types.usecase';
import { ListCardioMethodsUseCase } from './application/use-cases/list-cardio-methods.usecase';
import { ListExerciseMuscleGroupsUseCase } from './application/use-cases/list-exercise-muscle-groups.usecase';
import { ListExercisesUseCase } from './application/use-cases/list-exercises.usecase';
import { ListFoodsUseCase } from './application/use-cases/list-foods.usecase';
import { ListPlioExercisesUseCase } from './application/use-cases/list-plio-exercises.usecase';
import { ListPlioTypesUseCase } from './application/use-cases/list-plio-types.usecase';
import { ListMobilityExercisesUseCase } from './application/use-cases/list-mobility-exercises.usecase';
import { ListMobilityTypesUseCase } from './application/use-cases/list-mobility-types.usecase';
import { ListSportsUseCase } from './application/use-cases/list-sports.usecase';
import { UpdateIsometricExerciseUseCase } from './application/use-cases/update-isometric-exercise.usecase';
import { UpdateCardioMethodUseCase } from './application/use-cases/update-cardio-method.usecase';
import { UpdateExerciseUseCase } from './application/use-cases/update-exercise.usecase';
import { UpdateFoodUseCase } from './application/use-cases/update-food.usecase';
import { UpdatePlioExerciseUseCase } from './application/use-cases/update-plio-exercise.usecase';
import { UpdateMobilityExerciseUseCase } from './application/use-cases/update-mobility-exercise.usecase';
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
import { LibraryUnifiedController } from './presentation/controllers/library-unified.controller';
import { LibraryUnifiedService } from './application/library-unified.service';
import { LibrarySeedService } from './application/library-seed.service';

@Module({
  imports: [AuthModule, FilesModule],
  controllers: [
    LibraryController,
    LibraryFoodController,
    LibrarySpecializedController,
    LibraryMediaController,
    LibraryUnifiedController,
  ],
  providers: [
    LibraryUnifiedService,
    LibrarySeedService,
    CreateIsometricExerciseUseCase,
    CreateCardioMethodUseCase,
    CreateExerciseUseCase,
    CreateFoodUseCase,
    CreatePlioExerciseUseCase,
    CreateMobilityExerciseUseCase,
    CreateSportUseCase,
    DeleteIsometricExerciseUseCase,
    DeleteCardioMethodUseCase,
    DeleteExerciseUseCase,
    DeleteFoodUseCase,
    DeletePlioExerciseUseCase,
    DeleteMobilityExerciseUseCase,
    DeleteSportUseCase,
    ListIsometricExercisesUseCase,
    ListIsometricTypesUseCase,
    ListCardioMethodTypesUseCase,
    ListCardioMethodsUseCase,
    ListExerciseMuscleGroupsUseCase,
    ListExercisesUseCase,
    ListFoodsUseCase,
    ListPlioExercisesUseCase,
    ListPlioTypesUseCase,
    ListMobilityTypesUseCase,
    ListMobilityExercisesUseCase,
    ListSportsUseCase,
    UpdateIsometricExerciseUseCase,
    UpdateCardioMethodUseCase,
    UpdateExerciseUseCase,
    UpdateFoodUseCase,
    UpdatePlioExerciseUseCase,
    UpdateMobilityExerciseUseCase,
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
