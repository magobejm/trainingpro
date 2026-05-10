import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';

type CoachProvisionResult = {
  created: boolean;
  temporaryPassword: null | string;
  userId: string;
};

type SupabaseUser = {
  app_metadata?: { roles?: string[] };
  email?: string;
  id: string;
};

@Injectable()
export class CoachAuthProvisionerService {
  async ensureCoachAuthUser(email: string): Promise<CoachProvisionResult> {
    const normalizedEmail = normalizeEmail(email);
    const existing = await this.findUserByEmail(normalizedEmail);
    if (existing) {
      await this.mergeCoachRole(existing);
      return { created: false, temporaryPassword: null, userId: existing.id };
    }
    const temporaryPassword = this.generateTemporaryPassword();
    const created = await this.createUser(normalizedEmail, temporaryPassword);
    return { created: true, temporaryPassword, userId: created.id };
  }

  private async findUserByEmail(email: string): Promise<null | SupabaseUser> {
    let page = 1;
    const perPage = 200;
    let hasMore = true;
    while (hasMore) {
      const response = await this.callSupabase(`/auth/v1/admin/users?page=${page}&per_page=${perPage}`, { method: 'GET' });
      if (!response.ok) {
        throw new InternalServerErrorException('Unable to check auth user by email');
      }
      const payload = (await response.json()) as { users?: SupabaseUser[] };
      const users = payload.users ?? [];
      const user = users.find((item) => normalizeEmail(item.email) === email);
      if (user) {
        return user;
      }
      if (users.length < perPage) {
        return null;
      }
      page += 1;
      hasMore = users.length === perPage;
    }
    return null;
  }

  private async mergeCoachRole(user: SupabaseUser): Promise<void> {
    const existingRoles = user.app_metadata?.roles ?? [];
    if (existingRoles.includes('coach')) {
      return;
    }
    const roles = [...existingRoles, 'coach'];
    const response = await this.callSupabase(`/auth/v1/admin/users/${user.id}`, {
      body: JSON.stringify({ app_metadata: { roles } }),
      method: 'PUT',
    });
    if (!response.ok) {
      throw new InternalServerErrorException('Unable to update auth user roles');
    }
  }

  private async createUser(email: string, temporaryPassword: string): Promise<{ id: string }> {
    const response = await this.callSupabase('/auth/v1/admin/users', {
      body: JSON.stringify({
        app_metadata: { roles: ['coach'] },
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
