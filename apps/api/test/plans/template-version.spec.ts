import { ConflictException } from '@nestjs/common';
import { advanceTemplateVersion } from '../../src/modules/plans/application/template-version';

describe('template version claim', () => {
  it('returns 409 with the current version when the expected version lost the race', async () => {
    const tx = {
      planTemplate: {
        findFirst: async () => ({ templateVersion: 4 }),
        updateMany: async () => ({ count: 0 }),
      },
    };

    await expect(advanceTemplateVersion(tx as never, 'template', 1, 1)).rejects.toBeInstanceOf(ConflictException);
    try {
      await advanceTemplateVersion(tx as never, 'template', 1, 1);
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toEqual({
        message: 'A newer template save already exists',
        templateVersion: 4,
      });
    }
  });
});
