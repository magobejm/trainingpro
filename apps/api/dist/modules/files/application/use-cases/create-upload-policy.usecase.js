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
exports.CreateUploadPolicyUseCase = void 0;
const common_1 = require("@nestjs/common");
const file_upload_policy_1 = require("../../domain/policies/file-upload.policy");
let CreateUploadPolicyUseCase = class CreateUploadPolicyUseCase {
    uploadPolicy;
    constructor(uploadPolicy) {
        this.uploadPolicy = uploadPolicy;
    }
    execute(context, input) {
        this.assertRole(context.activeRole);
        return this.uploadPolicy.createPolicy(input);
    }
    assertRole(role) {
        if (role === 'client' || role === 'coach') {
            return;
        }
        throw new common_1.ForbiddenException('Unsupported role for file upload policy');
    }
};
exports.CreateUploadPolicyUseCase = CreateUploadPolicyUseCase;
exports.CreateUploadPolicyUseCase = CreateUploadPolicyUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [file_upload_policy_1.FileUploadPolicy])
], CreateUploadPolicyUseCase);
