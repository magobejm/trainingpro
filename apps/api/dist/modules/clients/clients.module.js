"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientsModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const files_module_1 = require("../files/files.module");
const archive_client_usecase_1 = require("./application/use-cases/archive-client.usecase");
const client_auth_provisioner_service_1 = require("./application/services/client-auth-provisioner.service");
const create_client_usecase_1 = require("./application/use-cases/create-client.usecase");
const get_client_usecase_1 = require("./application/use-cases/get-client.usecase");
const list_clients_usecase_1 = require("./application/use-cases/list-clients.usecase");
const list_client_objectives_usecase_1 = require("./application/use-cases/list-client-objectives.usecase");
const reset_client_password_usecase_1 = require("./application/use-cases/reset-client-password.usecase");
const update_client_usecase_1 = require("./application/use-cases/update-client.usecase");
const upload_client_avatar_usecase_1 = require("./application/use-cases/upload-client-avatar.usecase");
const clients_repository_port_1 = require("./domain/clients-repository.port");
const client_access_policy_1 = require("./domain/policies/client-access.policy");
const client_repository_prisma_1 = require("./infra/prisma/client.repository.prisma");
const clients_controller_1 = require("./presentation/controllers/clients.controller");
const client_ownership_guard_1 = require("./presentation/guards/client-ownership.guard");
let ClientsModule = class ClientsModule {
};
exports.ClientsModule = ClientsModule;
exports.ClientsModule = ClientsModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, files_module_1.FilesModule],
        controllers: [clients_controller_1.ClientsController],
        providers: [
            archive_client_usecase_1.ArchiveClientUseCase,
            client_auth_provisioner_service_1.ClientAuthProvisionerService,
            create_client_usecase_1.CreateClientUseCase,
            get_client_usecase_1.GetClientUseCase,
            list_clients_usecase_1.ListClientsUseCase,
            list_client_objectives_usecase_1.ListClientObjectivesUseCase,
            reset_client_password_usecase_1.ResetClientPasswordUseCase,
            update_client_usecase_1.UpdateClientUseCase,
            upload_client_avatar_usecase_1.UploadClientAvatarUseCase,
            client_access_policy_1.ClientAccessPolicy,
            client_ownership_guard_1.ClientOwnershipGuard,
            client_repository_prisma_1.ClientRepositoryPrisma,
            {
                provide: clients_repository_port_1.CLIENTS_REPOSITORY,
                useExisting: client_repository_prisma_1.ClientRepositoryPrisma,
            },
        ],
    })
], ClientsModule);
