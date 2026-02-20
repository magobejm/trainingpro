import type { AuthContext } from '../../../common/auth-context/auth-context';
import type { CardioMethodWriteInput, CardioMethodFilter } from './cardio-method.input';
import type { ExerciseFilter, ExerciseWriteInput } from './exercise.input';
import type { FoodFilter, FoodWriteInput } from './food.input';
import type { CardioMethodLibraryItem } from './entities/cardio-method-library-item';
import type { ExerciseLibraryItem } from './entities/exercise-library-item';
import type { FoodLibraryItem } from './entities/food-library-item';
import type { LibraryCatalogItem } from './entities/library-catalog-item';

export const LIBRARY_REPOSITORY = Symbol('LIBRARY_REPOSITORY');

export interface LibraryRepositoryPort {
  createCardioMethod(
    context: AuthContext,
    input: CardioMethodWriteInput,
  ): Promise<CardioMethodLibraryItem>;
  createExercise(context: AuthContext, input: ExerciseWriteInput): Promise<ExerciseLibraryItem>;
  createFood(context: AuthContext, input: FoodWriteInput): Promise<FoodLibraryItem>;
  deleteCardioMethod(context: AuthContext, itemId: string): Promise<void>;
  deleteExercise(context: AuthContext, itemId: string): Promise<void>;
  listCardioMethodTypes(): Promise<LibraryCatalogItem[]>;
  listCardioMethods(
    context: AuthContext,
    filter: CardioMethodFilter,
  ): Promise<CardioMethodLibraryItem[]>;
  listExerciseMuscleGroups(): Promise<LibraryCatalogItem[]>;
  listExercises(context: AuthContext, filter: ExerciseFilter): Promise<ExerciseLibraryItem[]>;
  listFoods(context: AuthContext, filter: FoodFilter): Promise<FoodLibraryItem[]>;
  updateCardioMethod(
    context: AuthContext,
    itemId: string,
    input: CardioMethodWriteInput,
  ): Promise<CardioMethodLibraryItem>;
  updateExercise(
    context: AuthContext,
    itemId: string,
    input: ExerciseWriteInput,
  ): Promise<ExerciseLibraryItem>;
  updateFood(context: AuthContext, itemId: string, input: FoodWriteInput): Promise<FoodLibraryItem>;
}
