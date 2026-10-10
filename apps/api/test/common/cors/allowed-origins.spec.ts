import { originIsAllowed } from '../../../src/common/cors/allowed-origins';

describe('CORS origins', () => {
  it('allows the local web, the local mobile web, and requests without an origin', () => {
    expect(originIsAllowed(undefined)).toBe(true);
    expect(originIsAllowed('http://localhost:5173')).toBe(true);
    expect(originIsAllowed('http://127.0.0.1:19006')).toBe(true);
  });

  it('allows the project Firebase site, its firebaseapp twin, and its preview channels', () => {
    expect(originIsAllowed('https://trainerpro-prod.web.app')).toBe(true);
    expect(originIsAllowed('https://trainerpro-prod.firebaseapp.com')).toBe(true);
    expect(originIsAllowed('https://trainerpro-prod--pr-12.web.app')).toBe(true);
    expect(originIsAllowed('https://trainerpro-prod--pr-12.firebaseapp.com')).toBe(true);
  });

  it('allows the Expo web app and its previews', () => {
    expect(originIsAllowed('https://trainer-pro-mobile.expo.app')).toBe(true);
    expect(originIsAllowed('https://trainer-pro-mobile--abc123.expo.app')).toBe(true);
  });

  it('rejects a foreign hosting site even when our own site is allowed', () => {
    expect(originIsAllowed('https://evil.web.app')).toBe(false);
    expect(originIsAllowed('https://evil.firebaseapp.com')).toBe(false);
    expect(originIsAllowed('https://not-trainerpro-prod.web.app')).toBe(false);
    expect(originIsAllowed('https://other-app.expo.app')).toBe(false);
    expect(originIsAllowed('https://other-app--abc.expo.app')).toBe(false);
  });

  it('accepts another own site from CORS_ORIGINS and still rejects everyone else', () => {
    const env = { CORS_ORIGINS: 'https://trainerpro-preview.web.app' };
    expect(originIsAllowed('https://trainerpro-preview.web.app', env)).toBe(true);
    expect(originIsAllowed('https://trainerpro-preview.firebaseapp.com', env)).toBe(true);
    expect(originIsAllowed('https://trainerpro-preview--qa.web.app', env)).toBe(true);
    expect(originIsAllowed('https://evil.web.app', env)).toBe(false);
  });
});
