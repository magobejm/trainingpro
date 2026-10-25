import { describe, expect, it } from 'vitest';
import { acceptChatFile, CHAT_ATTACHMENT_MAX_BYTES } from './chat-attachment.utils';

describe('acceptChatFile', () => {
  it('accepts an image, a pdf and an audio file within 1MB', () => {
    expect(acceptChatFile({ mimeType: 'image/jpeg', name: 'photo.jpg', sizeBytes: 1200 })?.mimeType).toBe('image/jpeg');
    expect(acceptChatFile({ mimeType: 'application/pdf', name: 'note.pdf', sizeBytes: 1200 })?.mimeType).toBe(
      'application/pdf',
    );
    expect(acceptChatFile({ mimeType: '', name: 'voice.mp3', sizeBytes: 1200 })?.mimeType).toBe('audio/mpeg');
  });

  it('rejects files over 1MB and unsupported types', () => {
    expect(acceptChatFile({ mimeType: 'image/jpeg', name: 'big.jpg', sizeBytes: CHAT_ATTACHMENT_MAX_BYTES + 1 })).toBeNull();
    expect(
      acceptChatFile({ mimeType: 'image/jpeg', name: 'limit.jpg', sizeBytes: CHAT_ATTACHMENT_MAX_BYTES })?.mimeType,
    ).toBe('image/jpeg');
    expect(acceptChatFile({ mimeType: 'text/plain', name: 'note.txt', sizeBytes: 20 })).toBeNull();
  });
});

describe('acceptChatFile video', () => {
  it('accepts mp4 and mov videos up to 20MB', () => {
    expect(acceptChatFile({ mimeType: 'video/mp4', name: 'set.mp4', sizeBytes: 15_000_000 })?.mimeType).toBe('video/mp4');
    expect(acceptChatFile({ mimeType: '', name: 'set.MOV', sizeBytes: 1200 })?.mimeType).toBe('video/quicktime');
  });

  it('rejects videos above 20MB and unsupported video types', () => {
    expect(acceptChatFile({ mimeType: 'video/mp4', name: 'big.mp4', sizeBytes: 21 * 1024 * 1024 })).toBeNull();
    expect(acceptChatFile({ mimeType: 'video/x-msvideo', name: 'a.avi', sizeBytes: 100 })).toBeNull();
  });
});
