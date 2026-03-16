import type { AuthContext } from '../../../common/auth-context/auth-context';
import type { CardioMethodWriteInput, CardioMethodFilter } from './cardio-method.input';
import type { ExerciseFilter, ExerciseWriteInput } from './exercise.input';
import type { FoodFilter, FoodWriteInput } from './food.input';
import type { IsometricExerciseFilter, IsometricExerciseWriteInput } from './isometric-exercise.input';
import type { PlioExerciseFilter, PlioExerciseWriteInput } from './plio-exercise.input';
import type { MobilityExerciseFilter, MobilityExerciseWriteInput } from './mobility-exercise.input';
import type { SportWriteInput } from './sport.input';
import type { CardioMethodLibraryItem } from './entities/cardio-method-library-item';
import type { ExerciseLibraryItem } from './entities/exercise-library-item';
import type { FoodLibraryItem } from './entities/food-library-item';
import type { LibraryCatalogItem } from './entities/library-catalog-item';
import type { IsometricExerciseLibraryItem } from './entities/isometric-exercise-library-item';
import type { PlioExerciseLibraryItem } from './entities/plio-exercise-library-item';
import type { MobilityExerciseLibraryItem } from './entities/mobility-exercise-library-item';
import type { SportLibraryItem } from './entities/sport-library-item';

export const LIBRARY_REPOSITORY = Symbol('LIBRARY_REPOSITORY');

export interface LibraryRepositoryPort {
  createCardioMethod(
    context: AuthContext,
    input: CardioMethodWriteInput,
  ): Promise<CardioMethodLibraryItem>;
  createExercise(context: AuthContext, input: ExerciseWriteInput): Promise<ExerciseLibraryItem>;
  createFood(context: AuthContext, input: FoodWriteInput): Promise<FoodLibraryItem>;
  createIsometricExercise(
    context: AuthContext,
    input: IsometricExerciseWriteInput,
  ): Promise<IsometricExerciseLibraryItem>;
  createPlioExercise(
    context: AuthContext,
    input: PlioExerciseWriteInput,
  ): Promise<PlioExerciseLibraryItem>;
  createMobilityExercise(
    context: AuthContext,
    input: MobilityExerciseWriteInput,
  ): Promise<MobilityExerciseLibraryItem>;
  createSport(context: AuthContext, input: SportWriteInput): Promise<SportLibraryItem>;
  deleteCardioMethod(context: AuthContext, itemId: string): Promise<void>;
  deleteExercise(context: AuthContext, itemId: string): Promise<void>;
  deleteFood(context: AuthContext, itemId: string): Promise<void>;
  deleteIsometricExercise(context: AuthContext, itemId: string): Promise<void>;
  deletePlioExercise(context: AuthContext, itemId: string): Promise<void>;
  deleteMobilityExercise(context: AuthContext, itemId: string): Promise<void>;
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
  listIsometricExercises(
    context: AuthContext,
    filter: IsometricExerciseFilter,
  ): Promise<IsometricExerciseLibraryItem[]>;
  listIsometricTypes(context: AuthContext): Promise<LibraryCatalogItem[]>;
  listPlioExercises(
    context: AuthContext,
    filter: PlioExerciseFilter,
  ): Promise<PlioExerciseLibraryItem[]>;
  listPlioTypes(context: AuthContext): Promise<LibraryCatalogItem[]>;
  listMobilityExercises(
    context: AuthContext,
    filter: MobilityExerciseFilter,
  ): Promise<MobilityExerciseLibraryItem[]>;
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
  updateIsometricExercise(
    context: AuthContext,
    itemId: string,
    input: Partial<IsometricExerciseWriteInput>,
  ): Promise<IsometricExerciseLibraryItem>;
  updatePlioExercise(
    context: AuthContext,
    itemId: string,
    input: Partial<PlioExerciseWriteInput>,
  ): Promise<PlioExerciseLibraryItem>;
  updateMobilityExercise(
    context: AuthContext,
    itemId: string,
    input: Partial<MobilityExerciseWriteInput>,
  ): Promise<MobilityExerciseLibraryItem>;
  updateSport(
    context: AuthContext,
    itemId: string,
    input: Partial<SportWriteInput>,
  ): Promise<SportLibraryItem>;
}
