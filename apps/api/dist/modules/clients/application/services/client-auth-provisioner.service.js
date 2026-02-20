"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientAuthProvisionerService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
let ClientAuthProvisionerService = class ClientAuthProvisionerService {
    async ensureClientAuthUser(email) {
        const normalizedEmail = normalizeEmail(email);
        const existing = await this.findUserByEmail(normalizedEmail);
        if (existing) {
            return { created: false, temporaryPassword: null, userId: existing.id };
        }
        const temporaryPassword = this.generateTemporaryPassword();
        const created = await this.createUser(normalizedEmail, temporaryPassword);
        return { created: true, temporaryPassword, userId: created.id };
    }
    async rotateClientAuthPassword(email) {
        const normalizedEmail = normalizeEmail(email);
        const existing = await this.findUserByEmail(normalizedEmail);
        const temporaryPassword = this.generateTemporaryPassword();
        if (!existing) {
            const created = await this.createUser(normalizedEmail, temporaryPassword);
            return { temporaryPassword, userId: created.id };
        }
        await this.updateUserPassword(existing.id, temporaryPassword);
        return { temporaryPassword, userId: existing.id };
    }
    async findUserByEmail(email) {
        let page = 1;
        const perPage = 200;
        let hasMore = true;
        while (hasMore) {
            const response = await this.callSupabase(`/auth/v1/admin/users?page=${page}&per_page=${perPage}`, { method: 'GET' });
            if (!response.ok) {
                throw new common_1.InternalServerErrorException('Unable to check auth user by email');
            }
            const payload = (await response.json());
            const users = payload.users ?? [];
            const user = users.find((item) => normalizeEmail(item.email) === email);
            if (user) {
                return { id: user.id };
            }
            if (users.length < perPage) {
                return null;
            }
            page += 1;
            hasMore = users.length === perPage;
        }
        return null;
    }
    async createUser(email, temporaryPassword) {
        const response = await this.callSupabase('/auth/v1/admin/users', {
            body: JSON.stringify({
                app_metadata: { roles: ['client'] },
                email,
                email_confirm: true,
                password: temporaryPassword,
            }),
            method: 'POST',
        });
        if (!response.ok) {
            throw new common_1.InternalServerErrorException('Unable to create auth user');
        }
        const payload = (await response.json());
        return { id: payload.id };
    }
    async updateUserPassword(userId, temporaryPassword) {
        const response = await this.callSupabase(`/auth/v1/admin/users/${userId}`, {
            body: JSON.stringify({
                email_confirm: true,
                password: temporaryPassword,
            }),
            method: 'PUT',
        });
        if (!response.ok) {
            throw new common_1.InternalServerErrorException('Unable to reset auth user password');
        }
    }
    callSupabase(path, init) {
        const url = `${this.readSupabaseUrl()}${path}`;
        return fetch(url, {
            ...init,
            headers: {
                apikey: this.readServiceRoleKey(),
                Authorization: `Bearer ${this.readServiceRoleKey()}`,
                'Content-Type': 'application/json',
                ...(init.headers ?? {}),
            },
        });
    }
    generateTemporaryPassword() {
        const token = (0, node_crypto_1.randomBytes)(9).toString('base64url');
        return `Tp!${token}9`;
    }
    readServiceRoleKey() {
        const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!value) {
            throw new common_1.InternalServerErrorException('Missing SUPABASE_SERVICE_ROLE_KEY');
        }
        return value;
    }
    readSupabaseUrl() {
        const value = process.env.SUPABASE_URL;
        if (!value) {
            throw new common_1.InternalServerErrorException('Missing SUPABASE_URL');
        }
        return value;
    }
};
exports.ClientAuthProvisionerService = ClientAuthProvisionerService;
exports.ClientAuthProvisionerService = ClientAuthProvisionerService = __decorate([
    (0, common_1.Injectable)()
], ClientAuthProvisionerService);
function normalizeEmail(value) {
    return (value ?? '').trim().toLowerCase();
}
