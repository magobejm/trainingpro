import { LibraryItemScope } from '@prisma/client';

export function coachOrGlobal(coachMembershipId: string) {
  return {
    archivedAt: null,
    OR: [{ scope: LibraryItemScope.GLOBAL }, { coachMembershipId, scope: LibraryItemScope.COACH }],
  };
}
