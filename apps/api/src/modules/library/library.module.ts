import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';
import { CreateCardioMethodUseCase } from './application/use-cases/create-cardio-method.usecase';
import { CreateExerciseUseCase } from './application/use-cases/create-exercise.usecase';
import { CreateFoodUseCase } from './application/use-cases/create-food.usecase';
import { DeleteCardioMethodUseCase } from './application/use-cases/delete-cardio-method.usecase';
import { DeleteExerciseUseCase } from './application/use-cases/delete-exercise.usecase';
import { ListCardioMethodTypesUseCase } from './application/use-cases/list-cardio-method-types.usecase';
import { ListCardioMethodsUseCase } from './application/use-cases/list-cardio-methods.usecase';
import { ListExerciseMuscleGroupsUseCase } from './application/use-cases/list-exercise-muscle-groups.usecase';
import { ListExercisesUseCase } from './application/use-cases/list-exercises.usecase';
import { ListFoodsUseCase } from './application/use-cases/list-foods.usecase';
import { UpdateCardioMethodUseCase } from './application/use-cases/update-cardio-method.usecase';
import { UpdateExerciseUseCase } from './application/use-cases/update-exercise.usecase';
import { UpdateFoodUseCase } from './application/use-cases/update-food.usecase';
import { UploadLibraryMediaImageUseCase } from './application/use-cases/upload-library-media-image.usecase';
import { LIBRARY_REPOSITORY } from './domain/library-repository.port';
import { LibraryEditPolicy } from './domain/policies/library-edit.policy';
import { LibraryRepositoryPrisma } from './infra/prisma/library.repository.prisma';
import { LibraryController } from './presentation/controllers/library.controller';

@Module({
  imports: [AuthModule, FilesModule],
  controllers: [LibraryController],
  providers: [
    CreateCardioMethodUseCase,
    CreateExerciseUseCase,
    CreateFoodUseCase,
    DeleteCardioMethodUseCase,
    DeleteExerciseUseCase,
    ListCardioMethodTypesUseCase,
    ListCardioMethodsUseCase,
    ListExerciseMuscleGroupsUseCase,
    ListExercisesUseCase,
    ListFoodsUseCase,
    UpdateCardioMethodUseCase,
    UpdateExerciseUseCase,
    UpdateFoodUseCase,
    UploadLibraryMediaImageUseCase,
    LibraryEditPolicy,
    LibraryRepositoryPrisma,
    {
      provide: LIBRARY_REPOSITORY,
      useExisting: LibraryRepositoryPrisma,
    },
  ],
})
export class LibraryModule {}
