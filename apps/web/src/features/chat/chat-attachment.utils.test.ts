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
