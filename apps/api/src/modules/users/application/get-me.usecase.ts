import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/domain/authenticated-user';
import type { UserProfile } from '../domain/user-profile';

@Injectable()
export class GetMeUseCase {
  async execute(authenticatedUser: AuthenticatedUser): Promise<UserProfile> {
    return {
      email: authenticatedUser.email ?? '',
      roles: authenticatedUser.roles,
      subject: authenticatedUser.subject,
    };
  }
}
