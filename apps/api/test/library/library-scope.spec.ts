import { LibraryItemScope } from '@prisma/client';
import { coachOrGlobal } from '../../src/modules/library/domain/library-scope';

describe('library scope', () => {
  test('keeps global items and the coach own items', () => {
    expect(coachOrGlobal('membership-1')).toEqual({
      archivedAt: null,
      OR: [{ scope: LibraryItemScope.GLOBAL }, { coachMembershipId: 'membership-1', scope: LibraryItemScope.COACH }],
    });
  });
});
