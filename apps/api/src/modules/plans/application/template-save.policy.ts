import { ConflictException } from '@nestjs/common';

export function assertExpectedTemplateVersion(expected: number | undefined, current: number): void {
  if (expected != null && expected !== current) {
    throw new ConflictException({
      message: 'A newer template save already exists',
      templateVersion: current,
    });
  }
}
