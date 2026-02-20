import type { AuthContext } from '../auth-context/auth-context';

export type OwnershipPolicyPort<TResourceId> = {
  canAccess(context: AuthContext, resourceId: TResourceId): Promise<boolean>;
};
