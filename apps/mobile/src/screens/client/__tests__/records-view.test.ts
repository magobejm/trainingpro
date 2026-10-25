import { flattenExercises } from '../records-view';

it('lists performed exercises with strength first', () => {
  const options = flattenExercises({
    cardio: [{ id: 'run', name: 'Correr' }],
    isometric: [],
    mobility: [],
    plio: [],
    sport: [],
    strength: [{ id: 'squat', name: 'Sentadilla' }],
  });
  expect(options.map((option) => option.name)).toEqual(['Sentadilla', 'Correr']);
});
