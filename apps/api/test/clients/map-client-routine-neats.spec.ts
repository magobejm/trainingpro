import { mapClientRoutineNeats } from '../../src/modules/clients/domain/map-client-routine-neats';

describe('mapClientRoutineNeats', () => {
  it('maps titles and trims empty descriptions to null', () => {
    const result = mapClientRoutineNeats([
      { id: 'n1', title: '10 000 pasos diarios', description: 'Camina cada día.' },
      { id: 'n2', title: 'Ir en bici al trabajo', description: '  ' },
      { id: 'n3', title: 'Subir las escaleras a casa', description: null },
    ]);

    expect(result).toEqual([
      { id: 'n1', title: '10 000 pasos diarios', description: 'Camina cada día.' },
      { id: 'n2', title: 'Ir en bici al trabajo', description: null },
      { id: 'n3', title: 'Subir las escaleras a casa', description: null },
    ]);
  });
});
