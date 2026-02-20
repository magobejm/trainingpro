"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const org_admin_repository_port_1 = require("./domain/org-admin.repository.port");
const org_admin_repository_prisma_1 = require("./infra/prisma/org-admin.repository.prisma");
const get_org_occupancy_usecase_1 = require("./application/get-org-occupancy.usecase");
const update_client_limit_usecase_1 = require("./application/update-client-limit.usecase");
const org_admin_controller_1 = require("./presentation/controllers/org-admin.controller");
let OrgModule = class OrgModule {
};
exports.OrgModule = OrgModule;
exports.OrgModule = OrgModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        controllers: [org_admin_controller_1.OrgAdminController],
        providers: [
            get_org_occupancy_usecase_1.GetOrgOccupancyUseCase,
            update_client_limit_usecase_1.UpdateClientLimitUseCase,
            org_admin_repository_prisma_1.OrgAdminRepositoryPrisma,
            {
                provide: org_admin_repository_port_1.ORG_ADMIN_REPOSITORY,
                useExisting: org_admin_repository_prisma_1.OrgAdminRepositoryPrisma,
            },
        ],
    })
], OrgModule);
