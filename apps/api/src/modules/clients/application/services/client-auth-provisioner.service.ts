import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';

type ProvisionResult = {
  created: boolean;
  temporaryPassword: null | string;
  userId: string;
};

@Injectable()
export class ClientAuthProvisionerService {
  async ensureClientAuthUser(email: string): Promise<ProvisionResult> {
    const normalizedEmail = normalizeEmail(email);
    const existing = await this.findUserByEmail(normalizedEmail);
    if (existing) {
      return { created: false, temporaryPassword: null, userId: existing.id };
    }
    const temporaryPassword = this.generateTemporaryPassword();
    const created = await this.createUser(normalizedEmail, temporaryPassword);
    return { created: true, temporaryPassword, userId: created.id };
  }

  async rotateClientAuthPassword(
    email: string,
  ): Promise<{ temporaryPassword: string; userId: string }> {
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

  private async findUserByEmail(email: string): Promise<null | { id: string }> {
    let page = 1;
    const perPage = 200;
    let hasMore = true;
    while (hasMore) {
      const response = await this.callSupabase(
        `/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
        { method: 'GET' },
      );
      if (!response.ok) {
        throw new InternalServerErrorException('Unable to check auth user by email');
      }
      const payload = (await response.json()) as { users?: Array<{ email?: string; id: string }> };
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

  private async createUser(email: string, temporaryPassword: string): Promise<{ id: string }> {
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
      throw new InternalServerErrorException('Unable to create auth user');
    }
    const payload = (await response.json()) as { id: string };
    return { id: payload.id };
  }

  private async updateUserPassword(userId: string, temporaryPassword: string): Promise<void> {
    const response = await this.callSupabase(`/auth/v1/admin/users/${userId}`, {
      body: JSON.stringify({
        email_confirm: true,
        password: temporaryPassword,
      }),
      method: 'PUT',
    });
    if (!response.ok) {
      throw new InternalServerErrorException('Unable to reset auth user password');
    }
  }

  private callSupabase(path: string, init: RequestInit): Promise<Response> {
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

  private generateTemporaryPassword(): string {
    const token = randomBytes(9).toString('base64url');
    return `Tp!${token}9`;
  }

  private readServiceRoleKey(): string {
    const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!value) {
      throw new InternalServerErrorException('Missing SUPABASE_SERVICE_ROLE_KEY');
    }
    return value;
  }

  private readSupabaseUrl(): string {
    const value = process.env.SUPABASE_URL;
    if (!value) {
      throw new InternalServerErrorException('Missing SUPABASE_URL');
    }
    return value;
  }
}

function normalizeEmail(value?: string): string {
  return (value ?? '').trim().toLowerCase();
}
