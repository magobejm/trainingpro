import { formatDelta, groupPhotosByPose, parseDecimalInput, readMeasurementForm } from '../client-measures.helpers';
import type { ClientProgressPhoto } from '../../../data/hooks/useClientMeQuery';

function photo(id: string, pose?: ClientProgressPhoto['pose']): ClientProgressPhoto {
  return {
    archived: false,
    clientId: 'c1',
    createdAt: '2026-10-24T00:00:00.000Z',
    id,
    imageUrl: id,
    pose,
    updatedAt: '2026-10-24T00:00:00.000Z',
  };
}

it('groups progress photos by pose and keeps unlabeled ones apart', () => {
  const groups = groupPhotosByPose([photo('a', 'front'), photo('b', 'side'), photo('c'), photo('d', 'back')]);
  expect(groups.front.map((item) => item.id)).toEqual(['a']);
  expect(groups.side.map((item) => item.id)).toEqual(['b']);
  expect(groups.back.map((item) => item.id)).toEqual(['d']);
  expect(groups.other.map((item) => item.id)).toEqual(['c']);
});

it('accepts a comma decimal and rejects text', () => {
  expect(parseDecimalInput('72,5')).toBe(72.5);
  expect(parseDecimalInput('')).toBeUndefined();
  expect(parseDecimalInput('abc')).toBeUndefined();
});

it('reads a valid form and rejects an out of range value', () => {
  const empty = { heightCm: '', hipCm: '', waistCm: '', weightKg: '' };
  expect(readMeasurementForm({ ...empty, weightKg: '72,5' })).toEqual({ body: { weightKg: 72.5 } });
  expect(readMeasurementForm(empty)).toEqual({ error: 'empty' });
  expect(readMeasurementForm({ ...empty, waistCm: '10' })).toEqual({ error: 'invalid' });
});

it('formats the difference against the previous value', () => {
  expect(formatDelta(72.5, 72.1)).toBe('+0.4');
  expect(formatDelta(80, 81)).toBe('-1');
  expect(formatDelta(80, null)).toBeNull();
});
