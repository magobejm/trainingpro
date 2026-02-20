"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibraryController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const read_auth_context_1 = require("../../../../common/auth-context/read-auth-context");
const roles_decorator_1 = require("../../../auth/presentation/decorators/roles.decorator");
const auth_guard_1 = require("../../../auth/presentation/guards/auth.guard");
const roles_guard_1 = require("../../../auth/presentation/guards/roles.guard");
const create_cardio_method_usecase_1 = require("../../application/use-cases/create-cardio-method.usecase");
const create_exercise_usecase_1 = require("../../application/use-cases/create-exercise.usecase");
const create_food_usecase_1 = require("../../application/use-cases/create-food.usecase");
const delete_cardio_method_usecase_1 = require("../../application/use-cases/delete-cardio-method.usecase");
const delete_exercise_usecase_1 = require("../../application/use-cases/delete-exercise.usecase");
const list_cardio_method_types_usecase_1 = require("../../application/use-cases/list-cardio-method-types.usecase");
const list_cardio_methods_usecase_1 = require("../../application/use-cases/list-cardio-methods.usecase");
const list_exercise_muscle_groups_usecase_1 = require("../../application/use-cases/list-exercise-muscle-groups.usecase");
const list_exercises_usecase_1 = require("../../application/use-cases/list-exercises.usecase");
const list_foods_usecase_1 = require("../../application/use-cases/list-foods.usecase");
const upload_library_media_image_usecase_1 = require("../../application/use-cases/upload-library-media-image.usecase");
const update_cardio_method_usecase_1 = require("../../application/use-cases/update-cardio-method.usecase");
const update_exercise_usecase_1 = require("../../application/use-cases/update-exercise.usecase");
const update_food_usecase_1 = require("../../application/use-cases/update-food.usecase");
const create_cardio_method_dto_1 = require("../dto/create-cardio-method.dto");
const create_exercise_dto_1 = require("../dto/create-exercise.dto");
const create_food_dto_1 = require("../dto/create-food.dto");
const library_item_id_param_dto_1 = require("../dto/library-item-id-param.dto");
const list_cardio_methods_query_dto_1 = require("../dto/list-cardio-methods-query.dto");
const list_exercises_query_dto_1 = require("../dto/list-exercises-query.dto");
const list_foods_query_dto_1 = require("../dto/list-foods-query.dto");
const update_cardio_method_dto_1 = require("../dto/update-cardio-method.dto");
const update_exercise_dto_1 = require("../dto/update-exercise.dto");
const update_food_dto_1 = require("../dto/update-food.dto");
let LibraryController = class LibraryController {
    createCardioMethodUseCase;
    createExerciseUseCase;
    createFoodUseCase;
    deleteCardioMethodUseCase;
    deleteExerciseUseCase;
    listCardioMethodTypesUseCase;
    listCardioMethodsUseCase;
    listExerciseMuscleGroupsUseCase;
    listExercisesUseCase;
    listFoodsUseCase;
    updateCardioMethodUseCase;
    updateExerciseUseCase;
    updateFoodUseCase;
    uploadLibraryMediaImageUseCase;
    constructor(createCardioMethodUseCase, createExerciseUseCase, createFoodUseCase, deleteCardioMethodUseCase, deleteExerciseUseCase, listCardioMethodTypesUseCase, listCardioMethodsUseCase, listExerciseMuscleGroupsUseCase, listExercisesUseCase, listFoodsUseCase, updateCardioMethodUseCase, updateExerciseUseCase, updateFoodUseCase, uploadLibraryMediaImageUseCase) {
        this.createCardioMethodUseCase = createCardioMethodUseCase;
        this.createExerciseUseCase = createExerciseUseCase;
        this.createFoodUseCase = createFoodUseCase;
        this.deleteCardioMethodUseCase = deleteCardioMethodUseCase;
        this.deleteExerciseUseCase = deleteExerciseUseCase;
        this.listCardioMethodTypesUseCase = listCardioMethodTypesUseCase;
        this.listCardioMethodsUseCase = listCardioMethodsUseCase;
        this.listExerciseMuscleGroupsUseCase = listExerciseMuscleGroupsUseCase;
        this.listExercisesUseCase = listExercisesUseCase;
        this.listFoodsUseCase = listFoodsUseCase;
        this.updateCardioMethodUseCase = updateCardioMethodUseCase;
        this.updateExerciseUseCase = updateExerciseUseCase;
        this.updateFoodUseCase = updateFoodUseCase;
        this.uploadLibraryMediaImageUseCase = uploadLibraryMediaImageUseCase;
    }
    async listCardioMethodTypes() {
        const items = await this.listCardioMethodTypesUseCase.execute();
        return { items };
    }
    async listExerciseMuscleGroups() {
        const items = await this.listExerciseMuscleGroupsUseCase.execute();
        return { items };
    }
    async listCardioMethods(query, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const items = await this.listCardioMethodsUseCase.execute(auth, query);
        return { items: items.map(toOutput) };
    }
    async listExercises(query, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const items = await this.listExercisesUseCase.execute(auth, query);
        return { items: items.map(toOutput) };
    }
    async listFoods(query, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const items = await this.listFoodsUseCase.execute(auth, query);
        return { items: items.map(toOutput) };
    }
    async createCardioMethod(body, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const item = await this.createCardioMethodUseCase.execute(auth, body);
        return toOutput(item);
    }
    async createExercise(body, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const item = await this.createExerciseUseCase.execute(auth, body);
        return toOutput(item);
    }
    async createFood(body, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const item = await this.createFoodUseCase.execute(auth, body);
        return toOutput(item);
    }
    async uploadMediaImage(request, file) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        if (!file) {
            return { imageUrl: null };
        }
        return this.uploadLibraryMediaImageUseCase.execute(auth, file);
    }
    async updateCardioMethod(params, body, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const item = await this.updateCardioMethodUseCase.execute(auth, params.itemId, body);
        return toOutput(item);
    }
    async updateExercise(params, body, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const item = await this.updateExerciseUseCase.execute(auth, params.itemId, body);
        return toOutput(item);
    }
    async updateFood(params, body, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const item = await this.updateFoodUseCase.execute(auth, params.itemId, body);
        return toOutput(item);
    }
    async deleteCardioMethod(params, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        await this.deleteCardioMethodUseCase.execute(auth, params.itemId);
        return { status: 'ok' };
    }
    async deleteExercise(params, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        await this.deleteExerciseUseCase.execute(auth, params.itemId);
        return { status: 'ok' };
    }
};
exports.LibraryController = LibraryController;
__decorate([
    (0, common_1.Get)('catalogs/cardio-method-types'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "listCardioMethodTypes", null);
__decorate([
    (0, common_1.Get)('catalogs/muscle-groups'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "listExerciseMuscleGroups", null);
__decorate([
    (0, common_1.Get)('cardio-methods'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_cardio_methods_query_dto_1.ListCardioMethodsQueryDto, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "listCardioMethods", null);
__decorate([
    (0, common_1.Get)('exercises'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_exercises_query_dto_1.ListExercisesQueryDto, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "listExercises", null);
__decorate([
    (0, common_1.Get)('foods'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_foods_query_dto_1.ListFoodsQueryDto, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "listFoods", null);
__decorate([
    (0, common_1.Post)('cardio-methods'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_cardio_method_dto_1.CreateCardioMethodDto, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "createCardioMethod", null);
__decorate([
    (0, common_1.Post)('exercises'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_exercise_dto_1.CreateExerciseDto, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "createExercise", null);
__decorate([
    (0, common_1.Post)('foods'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_food_dto_1.CreateFoodDto, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "createFood", null);
__decorate([
    (0, common_1.Post)('media-image'),
    (0, common_1.HttpCode)(200),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "uploadMediaImage", null);
__decorate([
    (0, common_1.Patch)('cardio-methods/:itemId'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [library_item_id_param_dto_1.LibraryItemIdParamDto,
        update_cardio_method_dto_1.UpdateCardioMethodDto, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "updateCardioMethod", null);
__decorate([
    (0, common_1.Patch)('exercises/:itemId'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [library_item_id_param_dto_1.LibraryItemIdParamDto,
        update_exercise_dto_1.UpdateExerciseDto, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "updateExercise", null);
__decorate([
    (0, common_1.Patch)('foods/:itemId'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [library_item_id_param_dto_1.LibraryItemIdParamDto,
        update_food_dto_1.UpdateFoodDto, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "updateFood", null);
__decorate([
    (0, common_1.Delete)('cardio-methods/:itemId'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [library_item_id_param_dto_1.LibraryItemIdParamDto, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "deleteCardioMethod", null);
__decorate([
    (0, common_1.Delete)('exercises/:itemId'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [library_item_id_param_dto_1.LibraryItemIdParamDto, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "deleteExercise", null);
exports.LibraryController = LibraryController = __decorate([
    (0, common_1.Controller)('library'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('coach'),
    __metadata("design:paramtypes", [create_cardio_method_usecase_1.CreateCardioMethodUseCase,
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
        upload_library_media_image_usecase_1.UploadLibraryMediaImageUseCase])
], LibraryController);
function toOutput(item) {
    const createdAt = item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt;
    const updatedAt = item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt;
    return {
        ...item,
        createdAt,
        updatedAt,
    };
}
