import type { AppRole } from '../../modules/auth/domain/role';

export type AuthContext = {
  activeRole: AppRole;
  email?: string;
  roles: AppRole[];
  subject: string;
};
