"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const express_1 = __importDefault(require("express"));
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const zod_validation_pipe_1 = require("./common/zod-validation.pipe");
loadEnvFiles();
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Active-Role'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        origin: allowedCorsOrigins(),
    });
    app.use('/assets/avatars', express_1.default.static(resolveAvatarAssetsPath()));
    app.use('/uploads', express_1.default.static(resolveUploadsPath()));
    app.useGlobalPipes(new zod_validation_pipe_1.ZodValidationPipe());
    await app.listen(process.env.PORT ?? 8080);
}
function resolveAvatarAssetsPath() {
    const candidates = [
        (0, node_path_1.resolve)(process.cwd(), 'apps/storage/avatar'),
        (0, node_path_1.resolve)(process.cwd(), '../storage/avatar'),
        (0, node_path_1.resolve)(process.cwd(), '../../apps/storage/avatar'),
    ];
    const match = candidates.find((item) => (0, node_fs_1.existsSync)(item));
    return match ?? (0, node_path_1.resolve)(process.cwd(), 'apps/storage/avatar');
}
function resolveUploadsPath() {
    const candidates = [
        (0, node_path_1.resolve)(process.cwd(), 'apps/storage/uploads'),
        (0, node_path_1.resolve)(process.cwd(), '../storage/uploads'),
        (0, node_path_1.resolve)(process.cwd(), '../../apps/storage/uploads'),
    ];
    const match = candidates.find((item) => (0, node_fs_1.existsSync)(item));
    return match ?? (0, node_path_1.resolve)(process.cwd(), 'apps/storage/uploads');
}
void bootstrap();
function loadEnvFiles() {
    const runtime = process;
    if (!runtime.loadEnvFile) {
        return;
    }
    for (const filePath of envCandidates()) {
        if ((0, node_fs_1.existsSync)(filePath)) {
            runtime.loadEnvFile(filePath);
        }
    }
}
function envCandidates() {
    return [
        (0, node_path_1.resolve)(process.cwd(), '.env.local'),
        (0, node_path_1.resolve)(process.cwd(), '.env'),
        (0, node_path_1.resolve)(process.cwd(), 'apps/api/.env.local'),
        (0, node_path_1.resolve)(process.cwd(), 'apps/api/.env'),
        (0, node_path_1.resolve)(process.cwd(), 'prisma/.env'),
        (0, node_path_1.resolve)(process.cwd(), '../prisma/.env'),
        (0, node_path_1.resolve)(process.cwd(), '../../prisma/.env'),
    ];
}
function allowedCorsOrigins() {
    const defaults = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:19006',
        'http://127.0.0.1:19006',
    ];
    const raw = process.env.CORS_ORIGINS;
    if (!raw) {
        return defaults;
    }
    const fromEnv = raw
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    return [...new Set([...defaults, ...fromEnv])];
}
