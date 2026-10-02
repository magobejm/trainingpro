import {
  attachSessionYoutubeUrls,
  buildSessionYoutubeLookup,
} from '../../src/modules/sessions/domain/session-youtube.mapper';
import type { SessionInstance, SessionStrengthItem } from '../../src/modules/sessions/domain/session.entity';

describe('buildSessionYoutubeLookup', () => {
  it('maps library youtube urls onto session items by source id', () => {
    const lookup = buildSessionYoutubeLookup({
      cardio: [{ id: 'cardio-1', sourceCardioMethodId: 'cardio-lib' }],
      isometric: [{ id: 'iso-1', sourceIsometricExerciseId: 'iso-lib' }],
      library: {
        cardioMethods: [{ id: 'cardio-lib', youtubeUrl: 'https://youtu.be/cardio' }],
        exercises: [{ id: 'ex-lib', youtubeUrl: 'https://youtu.be/strength' }],
        isometricExercises: [{ id: 'iso-lib', youtubeUrl: 'https://youtu.be/iso' }],
        mobilityExercises: [{ id: 'mob-lib', youtubeUrl: 'https://youtu.be/mob' }],
        plioExercises: [{ id: 'plio-lib', youtubeUrl: 'https://youtu.be/plio' }],
      },
      mobility: [{ id: 'mob-1', sourceMobilityExerciseId: 'mob-lib' }],
      plio: [{ id: 'plio-1', sourcePlioExerciseId: 'plio-lib' }],
      strength: [{ id: 'str-1', sourceExerciseId: 'ex-lib' }],
    });

    expect(lookup.get('str-1')).toBe('https://youtu.be/strength');
    expect(lookup.get('cardio-1')).toBe('https://youtu.be/cardio');
    expect(lookup.get('plio-1')).toBe('https://youtu.be/plio');
    expect(lookup.get('mob-1')).toBe('https://youtu.be/mob');
    expect(lookup.get('iso-1')).toBe('https://youtu.be/iso');
  });

  it('skips blank urls and missing library rows', () => {
    const lookup = buildSessionYoutubeLookup({
      cardio: [],
      isometric: [],
      library: {
        cardioMethods: [],
        exercises: [{ id: 'ex-lib', youtubeUrl: '   ' }],
        isometricExercises: [],
        mobilityExercises: [],
        plioExercises: [],
      },
      mobility: [],
      plio: [],
      strength: [
        { id: 'str-1', sourceExerciseId: 'ex-lib' },
        { id: 'str-2', sourceExerciseId: null },
      ],
    });

    expect(lookup.size).toBe(0);
  });
});

describe('attachSessionYoutubeUrls', () => {
  it('copies matched urls onto session items', () => {
    const item = { id: 'str-1', type: 'strength', youtubeUrl: null } as unknown as SessionStrengthItem;
    const session = { items: [item] } as unknown as SessionInstance;
    const next = attachSessionYoutubeUrls(session, new Map([['str-1', 'https://youtu.be/strength']]));

    expect(next.items[0]?.youtubeUrl).toBe('https://youtu.be/strength');
  });
});
