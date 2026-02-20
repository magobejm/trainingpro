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
exports.ClientsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const read_auth_context_1 = require("../../../../common/auth-context/read-auth-context");
const roles_decorator_1 = require("../../../auth/presentation/decorators/roles.decorator");
const auth_guard_1 = require("../../../auth/presentation/guards/auth.guard");
const roles_guard_1 = require("../../../auth/presentation/guards/roles.guard");
const archive_client_usecase_1 = require("../../application/use-cases/archive-client.usecase");
const create_client_usecase_1 = require("../../application/use-cases/create-client.usecase");
const get_client_usecase_1 = require("../../application/use-cases/get-client.usecase");
const list_clients_usecase_1 = require("../../application/use-cases/list-clients.usecase");
const list_client_objectives_usecase_1 = require("../../application/use-cases/list-client-objectives.usecase");
const reset_client_password_usecase_1 = require("../../application/use-cases/reset-client-password.usecase");
const update_client_usecase_1 = require("../../application/use-cases/update-client.usecase");
const upload_client_avatar_usecase_1 = require("../../application/use-cases/upload-client-avatar.usecase");
const client_id_param_dto_1 = require("../dto/client-id-param.dto");
const create_client_dto_1 = require("../dto/create-client.dto");
const update_client_dto_1 = require("../dto/update-client.dto");
const client_ownership_guard_1 = require("../guards/client-ownership.guard");
let ClientsController = class ClientsController {
    archiveClientUseCase;
    createClientUseCase;
    getClientUseCase;
    listClientsUseCase;
    listClientObjectivesUseCase;
    resetClientPasswordUseCase;
    updateClientUseCase;
    uploadClientAvatarUseCase;
    constructor(archiveClientUseCase, createClientUseCase, getClientUseCase, listClientsUseCase, listClientObjectivesUseCase, resetClientPasswordUseCase, updateClientUseCase, uploadClientAvatarUseCase) {
        this.archiveClientUseCase = archiveClientUseCase;
        this.createClientUseCase = createClientUseCase;
        this.getClientUseCase = getClientUseCase;
        this.listClientsUseCase = listClientsUseCase;
        this.listClientObjectivesUseCase = listClientObjectivesUseCase;
        this.resetClientPasswordUseCase = resetClientPasswordUseCase;
        this.updateClientUseCase = updateClientUseCase;
        this.uploadClientAvatarUseCase = uploadClientAvatarUseCase;
    }
    async create(body, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const result = await this.createClientUseCase.execute(auth, mapCreateDto(body));
        return {
            client: mapClientOutput(result.client),
            credentials: result.credentials,
        };
    }
    async list(request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const clients = await this.listClientsUseCase.execute(auth);
        return { items: clients.map(mapClientOutput) };
    }
    async listObjectives() {
        const items = await this.listClientObjectivesUseCase.execute();
        return { items };
    }
    async getOne(params, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const client = await this.getClientUseCase.execute(auth, params.clientId);
        const objectiveOptions = await this.listClientObjectivesUseCase.execute();
        return {
            ...mapClientOutput(client),
            objectiveOptions,
        };
    }
    async update(params, body, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        const updated = await this.updateClientUseCase.execute(auth, params.clientId, mapUpdateDto(body));
        return mapClientOutput(updated);
    }
    async uploadAvatar(params, file, request) {
        if (!file) {
            throw new common_1.BadRequestException('Missing avatar file');
        }
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        return this.uploadClientAvatarUseCase.execute(auth, params.clientId, file);
    }
    async resetPassword(params, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        return this.resetClientPasswordUseCase.execute(auth, params.clientId);
    }
    async archive(params, request) {
        const auth = (0, read_auth_context_1.readAuthContext)(request);
        await this.archiveClientUseCase.execute(auth, params.clientId);
        return { status: 'archived' };
    }
};
exports.ClientsController = ClientsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_client_dto_1.CreateClientDto, Object]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('catalog/objectives'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "listObjectives", null);
__decorate([
    (0, common_1.Get)(':clientId'),
    (0, common_1.UseGuards)(client_ownership_guard_1.ClientOwnershipGuard),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [client_id_param_dto_1.ClientIdParamDto, Object]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Patch)(':clientId'),
    (0, common_1.UseGuards)(client_ownership_guard_1.ClientOwnershipGuard),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [client_id_param_dto_1.ClientIdParamDto,
        update_client_dto_1.UpdateClientDto, Object]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':clientId/avatar'),
    (0, common_1.UseGuards)(client_ownership_guard_1.ClientOwnershipGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [client_id_param_dto_1.ClientIdParamDto, Object, Object]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Post)(':clientId/reset-password'),
    (0, common_1.UseGuards)(client_ownership_guard_1.ClientOwnershipGuard),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [client_id_param_dto_1.ClientIdParamDto, Object]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Delete)(':clientId'),
    (0, common_1.UseGuards)(client_ownership_guard_1.ClientOwnershipGuard),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [client_id_param_dto_1.ClientIdParamDto, Object]),
    __metadata("design:returntype", Promise)
], ClientsController.prototype, "archive", null);
exports.ClientsController = ClientsController = __decorate([
    (0, common_1.Controller)('clients'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('coach'),
    __metadata("design:paramtypes", [archive_client_usecase_1.ArchiveClientUseCase,
        create_client_usecase_1.CreateClientUseCase,
        get_client_usecase_1.GetClientUseCase,
        list_clients_usecase_1.ListClientsUseCase,
        list_client_objectives_usecase_1.ListClientObjectivesUseCase,
        reset_client_password_usecase_1.ResetClientPasswordUseCase,
        update_client_usecase_1.UpdateClientUseCase,
        upload_client_avatar_usecase_1.UploadClientAvatarUseCase])
], ClientsController);
function mapUpdateDto(body) {
    return {
        ...body,
        birthDate: body.birthDate === undefined
            ? undefined
            : body.birthDate
                ? new Date(body.birthDate)
                : null,
    };
}
function mapCreateDto(body) {
    return {
        ...body,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
    };
}
function mapClientOutput(client) {
    return {
        avatarUrl: client.avatarUrl ?? resolveDefaultAvatarUrl(client.id),
        birthDate: client.birthDate ? client.birthDate.toISOString().slice(0, 10) : null,
        coachMembershipId: client.coachMembershipId,
        createdAt: client.createdAt.toISOString(),
        email: client.email,
        firstName: client.firstName,
        heightCm: client.heightCm,
        id: client.id,
        lastName: client.lastName,
        notes: client.notes,
        objective: client.objective,
        objectiveId: client.objectiveId,
        organizationId: client.organizationId,
        phone: client.phone,
        sex: client.sex,
        updatedAt: client.updatedAt.toISOString(),
        weightKg: client.weightKg,
    };
}
function resolveDefaultAvatarUrl(clientId) {
    const names = [
        'avatar-01.png',
        'avatar-02.png',
        'avatar-03.png',
        'avatar-04.png',
        'avatar-05.png',
        'avatar-06.png',
        'avatar-07.png',
        'avatar-08.png',
        'pixar-1.png',
        'pixar-2.png',
        'pixar-3.png',
        'pixar-4.png',
        'pixar-5.png',
        'pixar-6.png',
    ];
    const index = hashSeed(clientId) % names.length;
    return `${resolvePublicAssetBaseUrl()}/assets/avatars/${names[index]}`;
}
function resolvePublicAssetBaseUrl() {
    return process.env.PUBLIC_ASSET_BASE_URL ?? `http://localhost:${process.env.PORT ?? 8080}`;
}
function hashSeed(input) {
    let value = 0;
    for (let index = 0; index < input.length; index += 1) {
        value = (value * 31 + input.charCodeAt(index)) >>> 0;
    }
    return value;
}
