export type ChoosableRole = 'admin' | 'client' | 'coach';
export type RoleSurface = 'mobile' | 'web';

/** From least to most privilege. The first one is the preselected choice. */
export const ROLE_CHOICE_ORDER: ChoosableRole[] = ['client', 'coach', 'admin'];

const SURFACE_ROLES: Record<RoleSurface, ChoosableRole[]> = {
  // The web has no client app.
  web: ['coach', 'admin'],
  mobile: ['client', 'coach', 'admin'],
};

/** Roles of the account that this app can open, ordered from least to most privilege and without repeats. */
export function usableRoles(roles: readonly string[], surface: RoleSurface): ChoosableRole[] {
  return ROLE_CHOICE_ORDER.filter((role) => SURFACE_ROLES[surface].includes(role) && roles.includes(role));
}

/** The role marked by default in the selector: the one with the least privilege. */
export function defaultRole(roles: readonly string[], surface: RoleSurface): ChoosableRole | null {
  return usableRoles(roles, surface)[0] ?? null;
}

/** The role to enter with without asking: only when the account has exactly one usable role. */
export function onlyRole(roles: readonly string[], surface: RoleSurface): ChoosableRole | null {
  const usable = usableRoles(roles, surface);
  return usable.length === 1 ? (usable[0] ?? null) : null;
}
