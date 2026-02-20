"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const create_upload_policy_usecase_1 = require("./application/use-cases/create-upload-policy.usecase");
const file_storage_port_1 = require("./domain/file-storage.port");
const local_1 = require("./infra/local");
const file_upload_policy_1 = require("./domain/policies/file-upload.policy");
const supabase_1 = require("./infra/supabase");
const files_controller_1 = require("./presentation/controllers/files.controller");
let FilesModule = class FilesModule {
};
exports.FilesModule = FilesModule;
exports.FilesModule = FilesModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        controllers: [files_controller_1.FilesController],
        providers: [
            file_upload_policy_1.FileUploadPolicy,
            create_upload_policy_usecase_1.CreateUploadPolicyUseCase,
            {
                provide: file_storage_port_1.FILE_STORAGE,
                useFactory: () => createFileStorage(),
            },
        ],
        exports: [file_storage_port_1.FILE_STORAGE],
    })
], FilesModule);
function createFileStorage() {
    if (hasSupabaseStorageEnv()) {
        return supabase_1.SupabaseStorageAdapter.fromEnv();
    }
    return local_1.LocalDiskStorageAdapter.fromEnv();
}
function hasSupabaseStorageEnv() {
    return Boolean(process.env.SUPABASE_STORAGE_BUCKET &&
        process.env.SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_ROLE_KEY);
}
