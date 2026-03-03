import type { AuthContext } from '../../../common/auth-context/auth-context';
import type { CardioMethodWriteInput, CardioMethodFilter } from './cardio-method.input';
import type { ExerciseFilter, ExerciseWriteInput } from './exercise.input';
import type { FoodFilter, FoodWriteInput } from './food.input';
import type { PlioExerciseFilter, PlioExerciseWriteInput } from './plio-exercise.input';
import type { WarmupExerciseFilter, WarmupExerciseWriteInput } from './warmup-exercise.input';
import type { SportWriteInput } from './sport.input';
import type { CardioMethodLibraryItem } from './entities/cardio-method-library-item';
import type { ExerciseLibraryItem } from './entities/exercise-library-item';
import type { FoodLibraryItem } from './entities/food-library-item';
import type { LibraryCatalogItem } from './entities/library-catalog-item';
import type { PlioExerciseLibraryItem } from './entities/plio-exercise-library-item';
import type { WarmupExerciseLibraryItem } from './entities/warmup-exercise-library-item';
import type { SportLibraryItem } from './entities/sport-library-item';

export const LIBRARY_REPOSITORY = Symbol('LIBRARY_REPOSITORY');

export interface LibraryRepositoryPort {
  createCardioMethod(
    context: AuthContext,
    input: CardioMethodWriteInput,
  ): Promise<CardioMethodLibraryItem>;
  createExercise(context: AuthContext, input: ExerciseWriteInput): Promise<ExerciseLibraryItem>;
  createFood(context: AuthContext, input: FoodWriteInput): Promise<FoodLibraryItem>;
  createPlioExercise(
    context: AuthContext,
    input: PlioExerciseWriteInput,
  ): Promise<PlioExerciseLibraryItem>;
  createWarmupExercise(
    context: AuthContext,
    input: WarmupExerciseWriteInput,
  ): Promise<WarmupExerciseLibraryItem>;
  createSport(context: AuthContext, input: SportWriteInput): Promise<SportLibraryItem>;
  deleteCardioMethod(context: AuthContext, itemId: string): Promise<void>;
  deleteExercise(context: AuthContext, itemId: string): Promise<void>;
  deleteFood(context: AuthContext, itemId: string): Promise<void>;
  deletePlioExercise(context: AuthContext, itemId: string): Promise<void>;
  deleteWarmupExercise(context: AuthContext, itemId: string): Promise<void>;
  deleteSport(context: AuthContext, itemId: string): Promise<void>;
  listCardioMethodTypes(): Promise<LibraryCatalogItem[]>;
  listCardioMethods(
    context: AuthContext,
    filter: CardioMethodFilter,
  ): Promise<CardioMethodLibraryItem[]>;
  listMobilityTypes(context: AuthContext): Promise<LibraryCatalogItem[]>;
  listExerciseMuscleGroups(): Promise<LibraryCatalogItem[]>;
  listExercises(context: AuthContext, filter: ExerciseFilter): Promise<ExerciseLibraryItem[]>;
  listFoods(context: AuthContext, filter: FoodFilter): Promise<FoodLibraryItem[]>;
  listPlioExercises(
    context: AuthContext,
    filter: PlioExerciseFilter,
  ): Promise<PlioExerciseLibraryItem[]>;
  listPlioTypes(context: AuthContext): Promise<LibraryCatalogItem[]>;
  listWarmupExercises(
    context: AuthContext,
    filter: WarmupExerciseFilter,
  ): Promise<WarmupExerciseLibraryItem[]>;
  listSports(context: AuthContext, query?: string): Promise<SportLibraryItem[]>;
  updateCardioMethod(
    context: AuthContext,
    itemId: string,
    input: Partial<CardioMethodWriteInput>,
  ): Promise<CardioMethodLibraryItem>;
  updateExercise(
    context: AuthContext,
    itemId: string,
    input: Partial<ExerciseWriteInput>,
  ): Promise<ExerciseLibraryItem>;
  updateFood(
    context: AuthContext,
    itemId: string,
    input: Partial<FoodWriteInput>,
  ): Promise<FoodLibraryItem>;
  updatePlioExercise(
    context: AuthContext,
    itemId: string,
    input: Partial<PlioExerciseWriteInput>,
  ): Promise<PlioExerciseLibraryItem>;
  updateWarmupExercise(
    context: AuthContext,
    itemId: string,
    input: Partial<WarmupExerciseWriteInput>,
  ): Promise<WarmupExerciseLibraryItem>;
  updateSport(
    context: AuthContext,
    itemId: string,
    input: Partial<SportWriteInput>,
  ): Promise<SportLibraryItem>;
}
