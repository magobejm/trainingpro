import { BadRequestException } from '@nestjs/common';
import { PROGRESS_POSES, type ProgressPose } from '../../domain/client-progress-photo';

export function parseProgressPose(value: unknown, required: boolean): ProgressPose | null {
  if (value === undefined || value === null || value === '') {
    if (required) throw new BadRequestException('Progress photo pose is required');
    return null;
  }
  if (typeof value === 'string' && (PROGRESS_POSES as readonly string[]).includes(value)) {
    return value as ProgressPose;
  }
  throw new BadRequestException('Invalid progress photo pose');
}
