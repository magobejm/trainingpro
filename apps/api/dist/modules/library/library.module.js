"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibraryModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const files_module_1 = require("../files/files.module");
const create_cardio_method_usecase_1 = require("./application/use-cases/create-cardio-method.usecase");
const create_exercise_usecase_1 = require("./application/use-cases/create-exercise.usecase");
const create_food_usecase_1 = require("./application/use-cases/create-food.usecase");
const delete_cardio_method_usecase_1 = require("./application/use-cases/delete-cardio-method.usecase");
const delete_exercise_usecase_1 = require("./application/use-cases/delete-exercise.usecase");
const list_cardio_method_types_usecase_1 = require("./application/use-cases/list-cardio-method-types.usecase");
const list_cardio_methods_usecase_1 = require("./application/use-cases/list-cardio-methods.usecase");
const list_exercise_muscle_groups_usecase_1 = require("./application/use-cases/list-exercise-muscle-groups.usecase");
const list_exercises_usecase_1 = require("./application/use-cases/list-exercises.usecase");
const list_foods_usecase_1 = require("./application/use-cases/list-foods.usecase");
const update_cardio_method_usecase_1 = require("./application/use-cases/update-cardio-method.usecase");
const update_exercise_usecase_1 = require("./application/use-cases/update-exercise.usecase");
const update_food_usecase_1 = require("./application/use-cases/update-food.usecase");
const upload_library_media_image_usecase_1 = require("./application/use-cases/upload-library-media-image.usecase");
const library_repository_port_1 = require("./domain/library-repository.port");
const library_edit_policy_1 = require("./domain/policies/library-edit.policy");
const library_repository_prisma_1 = require("./infra/prisma/library.repository.prisma");
const library_controller_1 = require("./presentation/controllers/library.controller");
let LibraryModule = class LibraryModule {
};
exports.LibraryModule = LibraryModule;
exports.LibraryModule = LibraryModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, files_module_1.FilesModule],
        controllers: [library_controller_1.LibraryController],
        providers: [
            create_cardio_method_usecase_1.CreateCardioMethodUseCase,
            create_exercise_usecase_1.CreateExerciseUseCase,
            create_food_usecase_1.CreateFoodUseCase,
            delete_cardio_method_usecase_1.DeleteCardioMethodUseCase,
            delete_exercise_usecase_1.DeleteExerciseUseCase,
            list_cardio_method_types_usecase_1.ListCardioMethodTypesUseCase,
            list_cardio_methods_usecase_1.ListCardioMethodsUseCase,
            list_exercise_muscle_groups_usecase_1.ListExerciseMuscleGroupsUseCase,
            list_exercises_usecase_1.ListExercisesUseCase,
            list_foods_usecase_1.ListFoodsUseCase,
            update_cardio_method_usecase_1.UpdateCardioMethodUseCase,
            update_exercise_usecase_1.UpdateExerciseUseCase,
            update_food_usecase_1.UpdateFoodUseCase,
            upload_library_media_image_usecase_1.UploadLibraryMediaImageUseCase,
            library_edit_policy_1.LibraryEditPolicy,
            library_repository_prisma_1.LibraryRepositoryPrisma,
            {
                provide: library_repository_port_1.LIBRARY_REPOSITORY,
                useExisting: library_repository_prisma_1.LibraryRepositoryPrisma,
            },
        ],
    })
], LibraryModule);
