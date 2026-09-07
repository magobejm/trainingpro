import {
  buildYouTubePlayerUrl,
  getFullMediaUrl,
  getYouTubeThumbnailUrl,
  readYouTubeVideoId,
  resolvePlaceholder,
  toYouTubeEmbedUrl,
} from '../library-media.helpers';

describe('library-media.helpers', () => {
  const originalEnv = process.env.EXPO_PUBLIC_API_BASE_URL;

  beforeAll(() => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:8080';
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_API_BASE_URL = originalEnv;
  });

  it('resolves placeholders by category', () => {
    expect(resolvePlaceholder('strength')).toContain('/assets/placeholders/routine-placeholder.jpg');
    expect(resolvePlaceholder('cardio')).toContain('/assets/placeholders/cardio-bg.jpg');
    expect(resolvePlaceholder('sport')).toContain('/assets/placeholders/sports-placeholder.png');
  });

  it('returns placeholder when media url is missing', () => {
    expect(getFullMediaUrl('strength', null)).toBe(resolvePlaceholder('strength'));
    expect(getFullMediaUrl('mobility', '   ')).toBe(resolvePlaceholder('mobility'));
  });

  it('prefixes relative media urls with api base', () => {
    expect(getFullMediaUrl('strength', '/media/exercise.jpg')).toBe('http://localhost:8080/media/exercise.jpg');
    expect(getFullMediaUrl('strength', 'media/exercise.jpg')).toBe('http://localhost:8080/media/exercise.jpg');
  });

  it('parses youtube urls', () => {
    expect(readYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(readYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(toYouTubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(getYouTubeThumbnailUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    );
    expect(buildYouTubePlayerUrl('https://youtu.be/dQw4w9WgXcQ')).toContain('autoplay=1');
  });
});
