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
exports.FilesController = void 0;
const common_1 = require("@nestjs/common");
const read_auth_context_1 = require("../../../../common/auth-context/read-auth-context");
const roles_decorator_1 = require("../../../auth/presentation/decorators/roles.decorator");
const auth_guard_1 = require("../../../auth/presentation/guards/auth.guard");
const roles_guard_1 = require("../../../auth/presentation/guards/roles.guard");
const create_upload_policy_usecase_1 = require("../../application/use-cases/create-upload-policy.usecase");
const create_upload_policy_dto_1 = require("../dto/create-upload-policy.dto");
let FilesController = class FilesController {
    createUploadPolicyUseCase;
    constructor(createUploadPolicyUseCase) {
        this.createUploadPolicyUseCase = createUploadPolicyUseCase;
    }
    createPolicy(body, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        return this.createUploadPolicyUseCase.execute(auth, body);
    }
};
exports.FilesController = FilesController;
__decorate([
    (0, common_1.Post)('upload-policy'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_upload_policy_dto_1.CreateUploadPolicyDto, Object]),
    __metadata("design:returntype", void 0)
], FilesController.prototype, "createPolicy", null);
exports.FilesController = FilesController = __decorate([
    (0, common_1.Controller)('files'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('coach', 'client'),
    __metadata("design:paramtypes", [create_upload_policy_usecase_1.CreateUploadPolicyUseCase])
], FilesController);
