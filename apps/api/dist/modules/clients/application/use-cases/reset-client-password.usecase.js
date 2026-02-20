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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetClientPasswordUseCase = void 0;
const common_1 = require("@nestjs/common");
const client_auth_provisioner_service_1 = require("../services/client-auth-provisioner.service");
const get_client_usecase_1 = require("./get-client.usecase");
let ResetClientPasswordUseCase = class ResetClientPasswordUseCase {
    getClientUseCase;
    clientAuthProvisioner;
    constructor(getClientUseCase, clientAuthProvisioner) {
        this.getClientUseCase = getClientUseCase;
        this.clientAuthProvisioner = clientAuthProvisioner;
    }
    async execute(context, clientId) {
        const client = await this.getClientUseCase.execute(context, clientId);
        const updated = await this.clientAuthProvisioner.rotateClientAuthPassword(client.email);
        return { temporaryPassword: updated.temporaryPassword };
    }
};
exports.ResetClientPasswordUseCase = ResetClientPasswordUseCase;
exports.ResetClientPasswordUseCase = ResetClientPasswordUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [get_client_usecase_1.GetClientUseCase,
        client_auth_provisioner_service_1.ClientAuthProvisionerService])
], ResetClientPasswordUseCase);
