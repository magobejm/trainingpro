"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlansModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const create_cardio_template_usecase_1 = require("./application/use-cases/create-cardio-template.usecase");
const create_template_usecase_1 = require("./application/use-cases/create-template.usecase");
const list_cardio_templates_usecase_1 = require("./application/use-cases/list-cardio-templates.usecase");
const list_templates_usecase_1 = require("./application/use-cases/list-templates.usecase");
const update_cardio_template_usecase_1 = require("./application/use-cases/update-cardio-template.usecase");
const update_template_usecase_1 = require("./application/use-cases/update-template.usecase");
const cardio_rules_service_1 = require("./domain/cardio-rules.service");
const plans_repository_port_1 = require("./domain/plans-repository.port");
const plans_rules_service_1 = require("./domain/plans-rules.service");
const plans_repository_prisma_1 = require("./infra/prisma/plans.repository.prisma");
const plans_cardio_controller_1 = require("./presentation/controllers/plans-cardio.controller");
const plans_controller_1 = require("./presentation/controllers/plans.controller");
let PlansModule = class PlansModule {
};
exports.PlansModule = PlansModule;
exports.PlansModule = PlansModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        controllers: [plans_controller_1.PlansController, plans_cardio_controller_1.PlansCardioController],
        providers: [
            create_cardio_template_usecase_1.CreateCardioTemplateUseCase,
            create_template_usecase_1.CreateTemplateUseCase,
            list_cardio_templates_usecase_1.ListCardioTemplatesUseCase,
            list_templates_usecase_1.ListTemplatesUseCase,
            update_cardio_template_usecase_1.UpdateCardioTemplateUseCase,
            update_template_usecase_1.UpdateTemplateUseCase,
            cardio_rules_service_1.CardioRulesService,
            plans_rules_service_1.PlansRulesService,
            plans_repository_prisma_1.PlansRepositoryPrisma,
            {
                provide: plans_repository_port_1.PLANS_REPOSITORY,
                useExisting: plans_repository_prisma_1.PlansRepositoryPrisma,
            },
        ],
    })
], PlansModule);
