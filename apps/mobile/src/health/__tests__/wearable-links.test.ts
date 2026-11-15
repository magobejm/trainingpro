import { linkedCloudProviders } from '../wearable-links';

it('keeps a cloud account linked only while the saved status is connected', () => {
  const linked = linkedCloudProviders([
    { provider: 'GARMIN', status: 'CONNECTED' },
    { provider: 'POLAR', status: 'REVOKED' },
    { provider: 'HEALTH_CONNECT', status: 'CONNECTED' },
    { provider: 'strava', status: 'PENDING' },
  ]);

  expect(linked.has('garmin')).toBe(true);
  expect(linked.has('polar')).toBe(false);
  expect(linked.has('strava')).toBe(false);
});
