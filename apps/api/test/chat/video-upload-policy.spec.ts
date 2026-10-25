import { BadRequestException } from '@nestjs/common';
import { FILE_MAX_SIZE_BYTES, VIDEO_MAX_SIZE_BYTES } from '../../src/modules/files/domain/file.constants';
import { FileUploadPolicy } from '../../src/modules/files/domain/policies/file-upload.policy';

const THREAD = '11111111-1111-4111-8111-111111111111';
const policy = new FileUploadPolicy();

function make(mimeType: string, sizeBytes: number) {
  return policy.createPolicy({ fileName: 'clip.mp4', mimeType, sizeBytes, threadId: THREAD });
}

describe('FileUploadPolicy video support', () => {
  it('accepts mp4 and quicktime videos up to 20MB as VIDEO', () => {
    expect(make('video/mp4', VIDEO_MAX_SIZE_BYTES).kind).toBe('VIDEO');
    expect(make('video/quicktime', 5_000_000)).toMatchObject({ kind: 'VIDEO', maxSizeBytes: VIDEO_MAX_SIZE_BYTES });
  });

  it('rejects videos above 20MB', () => {
    expect(() => make('video/mp4', VIDEO_MAX_SIZE_BYTES + 1)).toThrow(BadRequestException);
  });

  it('keeps the 1MB limit for non video files', () => {
    expect(make('image/jpeg', FILE_MAX_SIZE_BYTES).maxSizeBytes).toBe(FILE_MAX_SIZE_BYTES);
    expect(() => make('image/jpeg', FILE_MAX_SIZE_BYTES + 1)).toThrow(BadRequestException);
    expect(() => make('application/pdf', 2_000_000)).toThrow(BadRequestException);
  });

  it('rejects unknown video types such as avi', () => {
    expect(() => make('video/x-msvideo', 1000)).toThrow('Unsupported file mime type');
  });
});
