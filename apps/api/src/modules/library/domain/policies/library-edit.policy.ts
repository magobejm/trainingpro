import { ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class LibraryEditPolicy {
  assertCoachOwned(itemScope: 'coach' | 'global', ownerId: null | string, coachId: string): void {
    if (itemScope !== 'coach') {
      throw new ForbiddenException('Global library items are read-only');
    }
    if (!ownerId || ownerId !== coachId) {
      throw new ForbiddenException('Coach cannot edit another coach item');
    }
  }
}
