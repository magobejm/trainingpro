/* eslint-disable max-lines-per-function, max-len */
export interface TestInputs {
  gender: 'M' | 'F';
  age: number;
  weight?: number;
  timeMin?: number;
  timeSec?: number;
  hr?: number;
  distance?: number;
  reps?: number;
  palier?: number;
  workload?: number;
  eyesClosed?: boolean;
  level?: 'Recreacional' | 'Avanzado';
}

export interface TestResult {
  rawScore: string;
  classification: string;
  color: string;
}

const COLORS: Record<string, string> = {
  Excelente: 'text-emerald-700 bg-emerald-100 border-emerald-200',
  Superior: 'text-emerald-700 bg-emerald-100 border-emerald-200',
  'Excelente / Élite': 'text-emerald-700 bg-emerald-100 border-emerald-200',
  Bueno: 'text-blue-700 bg-blue-100 border-blue-200',
  'Muy Bueno': 'text-blue-700 bg-blue-100 border-blue-200',
  'Por encima de lo normal': 'text-blue-700 bg-blue-100 border-blue-200',
  '+ Media': 'text-blue-700 bg-blue-100 border-blue-200',
  Medio: 'text-yellow-700 bg-yellow-100 border-yellow-200',
  Media: 'text-yellow-700 bg-yellow-100 border-yellow-200',
  'Rango Normal': 'text-yellow-700 bg-yellow-100 border-yellow-200',
  '- Media': 'text-orange-700 bg-orange-100 border-orange-200',
  Regular: 'text-orange-700 bg-orange-100 border-orange-200',
  Pobre: 'text-red-700 bg-red-100 border-red-200',
  'Por debajo de lo normal': 'text-red-700 bg-red-100 border-red-200',
  'Muy Pobre': 'text-red-800 bg-red-200 border-red-300',
  'N/A': 'text-slate-700 bg-slate-100 border-slate-200',
};

// Helper for ranges
const evaluateRange = (value: number, thresholds: number[], labels: string[], invert = false): string => {
  if (invert) {
    for (let i = 0; i < thresholds.length; i++) {
      if (value <= thresholds[i]!) return labels[i]!;
    }
  } else {
    for (let i = 0; i < thresholds.length; i++) {
      if (value >= thresholds[i]!) return labels[i]!;
    }
  }
  return labels[labels.length - 1]!;
};

const TEST_CODE_TO_NAME: Record<string, string> = {
  'balon-1': 'Lanzamiento de Balón Medicinal Sentado',
  'plank-1': 'Test de Resistencia de Plancha Isométrica (Plank Test)',
  test_1: 'Test de Caminata de Rockport (1 milla)',
  test_10: 'Salto Vertical de Sargent / CMJ',
  test_11: 'Test de Rascarse la Espalda (Back Scratch Test)',
  test_12: 'Test de Sit and Reach',
  test_13: 'Test de Apoyo Unipodal (Flamingo / SLS)',
  test_14: 'Test Pro Agility 5-10-5 (20-Yard Shuttle)',
  test_2: 'Test del Escalón de 3 Minutos del YMCA',
  test_3: 'Test Submáximo en Cicloergómetro (YMCA)',
  test_4: 'Test de Cooper (12 Minutos)',
  test_5: 'Test de Course-Navette (20 m Shuttle Run)',
  test_6: 'Test de Sentarse y Levantarse en 30 s (30-s Chair Stand)',
  test_7: 'Test de Flexiones (Push-Up Test)',
  test_8: 'Test de Dominadas Estrictas (Pull-Ups)',
  test_9: 'Salto Horizontal a Pies Juntos (Broad Jump)',
};

export const evaluateTest = (testKey: string, inputs: TestInputs): TestResult => {
  const testName = TEST_CODE_TO_NAME[testKey] ?? testKey;
  const {
    gender,
    age,
    weight = 0,
    timeMin = 0,
    timeSec = 0,
    hr = 0,
    distance = 0,
    reps = 0,
    palier = 0,
    workload = 0,
  } = inputs;

  let rawScore = '';
  let classification = 'N/A';

  try {
    switch (testName) {
      case 'Test de Caminata de Rockport (1 milla)': {
        const weightLbs = weight * 2.20462;
        const timeTotal = timeMin + timeSec / 60;
        const sex = gender === 'M' ? 1 : 0;
        const vo2 = 132.853 - 0.0769 * weightLbs - 0.3877 * age + 6.315 * sex - 3.2649 * timeTotal - 0.1565 * hr;
        rawScore = `${vo2.toFixed(1)} ml/kg/min`;
        classification = vo2 > 45 ? 'Excelente' : vo2 > 35 ? 'Bueno' : vo2 > 25 ? 'Regular' : 'Pobre';
        break;
      }

      case 'Test de Cooper (12 Minutos)': {
        rawScore = `${distance} m`;
        const labels = ['Superior', 'Excelente', 'Bueno', 'Regular', 'Pobre', 'Muy Pobre'];
        if (gender === 'M') {
          if (age < 30) classification = evaluateRange(distance, [2840, 2640, 2400, 2200, 1960], labels);
          else if (age < 40) classification = evaluateRange(distance, [2720, 2520, 2300, 2100, 1900], labels);
          else if (age < 50) classification = evaluateRange(distance, [2650, 2440, 2200, 2000, 1830], labels);
          else if (age < 60) classification = evaluateRange(distance, [2540, 2320, 2100, 1870, 1650], labels);
          else classification = evaluateRange(distance, [2360, 2120, 1930, 1650, 1400], labels);
        } else {
          if (age < 30) classification = evaluateRange(distance, [2330, 2160, 1970, 1790, 1550], labels);
          else if (age < 40) classification = evaluateRange(distance, [2240, 2080, 1900, 1690, 1510], labels);
          else if (age < 50) classification = evaluateRange(distance, [2160, 2000, 1790, 1580, 1410], labels);
          else if (age < 60) classification = evaluateRange(distance, [2090, 1900, 1690, 1500, 1350], labels);
          else classification = evaluateRange(distance, [1910, 1750, 1590, 1390, 1260], labels);
        }
        break;
      }

      case 'Test de Flexiones (Push-Up Test)': {
        rawScore = `${reps} reps`;
        const labels = ['Excelente', 'Bueno', 'Medio', 'Regular', 'Pobre'];
        if (gender === 'M') {
          if (age < 30) classification = evaluateRange(reps, [36, 29, 22, 17], labels);
          else if (age < 40) classification = evaluateRange(reps, [30, 22, 17, 12], labels);
          else if (age < 50) classification = evaluateRange(reps, [25, 17, 13, 10], labels);
          else if (age < 60) classification = evaluateRange(reps, [21, 13, 10, 7], labels);
          else classification = evaluateRange(reps, [18, 11, 8, 5], labels);
        } else {
          if (age < 30) classification = evaluateRange(reps, [30, 21, 15, 10], labels);
          else if (age < 40) classification = evaluateRange(reps, [27, 20, 13, 8], labels);
          else if (age < 50) classification = evaluateRange(reps, [24, 15, 11, 5], labels);
          else if (age < 60) classification = evaluateRange(reps, [21, 11, 7, 2], labels);
          else classification = evaluateRange(reps, [17, 12, 5, 1], labels);
        }
        break;
      }

      case 'Test de Resistencia de Plancha Isométrica (Plank Test)': {
        const totalSecs = timeMin * 60 + timeSec;
        rawScore = `${totalSecs} s`;
        const labels = ['Excelente', 'Bueno', 'Medio', 'Regular', 'Pobre'];
        if (gender === 'M') {
          if (age < 30) classification = evaluateRange(totalSecs, [135, 105, 75, 45], labels);
          else if (age < 40) classification = evaluateRange(totalSecs, [120, 90, 65, 40], labels);
          else if (age < 50) classification = evaluateRange(totalSecs, [105, 80, 55, 35], labels);
          else if (age < 60) classification = evaluateRange(totalSecs, [90, 65, 45, 30], labels);
          else classification = evaluateRange(totalSecs, [70, 50, 35, 20], labels);
        } else {
          if (age < 30) classification = evaluateRange(totalSecs, [120, 90, 60, 35], labels);
          else if (age < 40) classification = evaluateRange(totalSecs, [100, 75, 50, 30], labels);
          else if (age < 50) classification = evaluateRange(totalSecs, [85, 65, 45, 25], labels);
          else if (age < 60) classification = evaluateRange(totalSecs, [70, 50, 35, 20], labels);
          else classification = evaluateRange(totalSecs, [55, 40, 25, 15], labels);
        }
        break;
      }

      case 'Test del Escalón de 3 Minutos del YMCA': {
        rawScore = `${hr} ppm`;
        const labels = ['Excelente', 'Bueno', '+ Media', 'Media', '- Media', 'Pobre', 'Muy Pobre'];
        // Using invert=true because lower HR is better
        if (gender === 'M') {
          if (age < 26) classification = evaluateRange(hr, [70, 80, 88, 95, 102, 111], labels, true);
          else if (age < 36) classification = evaluateRange(hr, [76, 85, 91, 99, 107, 117], labels, true);
          else classification = evaluateRange(hr, [76, 88, 95, 103, 112, 119], labels, true); // Simplified upper brackets
        } else {
          if (age < 26) classification = evaluateRange(hr, [78, 86, 97, 103, 110, 118], labels, true);
          else if (age < 36) classification = evaluateRange(hr, [80, 89, 99, 107, 117, 126], labels, true);
          else classification = evaluateRange(hr, [85, 94, 102, 110, 118, 128], labels, true);
        }
        break;
      }

      case 'Test de Sit and Reach': {
        rawScore = `${distance} cm`;
        const labels = ['Excelente', 'Muy Bueno', 'Bueno', 'Regular', 'Pobre'];
        if (gender === 'M') {
          if (age < 30) classification = evaluateRange(distance, [40, 34, 30, 25], labels);
          else if (age < 40) classification = evaluateRange(distance, [38, 33, 28, 23], labels);
          else classification = evaluateRange(distance, [35, 29, 24, 18], labels);
        } else {
          if (age < 30) classification = evaluateRange(distance, [41, 37, 33, 28], labels);
          else if (age < 40) classification = evaluateRange(distance, [41, 36, 32, 27], labels);
          else classification = evaluateRange(distance, [38, 34, 30, 25], labels);
        }
        break;
      }

      case 'Test de Sentarse y Levantarse en 30 s (30-s Chair Stand)': {
        rawScore = `${reps} reps`;
        if (age < 60) {
          const threshold = gender === 'M' ? 22 : 20;
          classification = reps >= threshold ? 'Rango Normal' : 'Por debajo de lo normal';
        } else {
          classification = 'Rango Normal (Revisar tabla exacta por edad)';
        }
        break;
      }

      case 'Test de Course-Navette (20 m Shuttle Run)': {
        rawScore = `Palier ${palier}`;
        const labels = ['Excelente', 'Bueno', 'Medio', 'Regular', 'Pobre'];
        if (gender === 'M') {
          if (age < 30) classification = evaluateRange(palier, [12, 10.5, 8, 6], labels);
          else if (age < 40) classification = evaluateRange(palier, [11, 9.5, 7, 5], labels);
          else classification = evaluateRange(palier, [10, 8.5, 6, 4], labels);
        } else {
          if (age < 30) classification = evaluateRange(palier, [9.5, 8, 6, 4.5], labels);
          else if (age < 40) classification = evaluateRange(palier, [8.5, 7, 5, 3.5], labels);
          else classification = evaluateRange(palier, [7, 6, 4, 2.5], labels);
        }
        break;
      }

      case 'Test Pro Agility 5-10-5 (20-Yard Shuttle)': {
        rawScore = `${timeSec.toFixed(2)} s`;
        const labels = ['Excelente / Élite', 'Bueno', 'Medio', 'Pobre'];
        if (gender === 'M') {
          if (inputs.level === 'Avanzado') classification = evaluateRange(timeSec, [4.2, 4.39, 4.65], labels, true);
          else classification = evaluateRange(timeSec, [4.5, 4.79, 5.19], labels, true);
        } else {
          if (inputs.level === 'Avanzado') classification = evaluateRange(timeSec, [4.45, 4.69, 5.0], labels, true);
          else classification = evaluateRange(timeSec, [4.9, 5.19, 5.59], labels, true);
        }
        break;
      }

      case 'Test Submáximo en Cicloergómetro (YMCA)': {
        const vo2 = (1.8 * workload) / weight + 7;
        rawScore = `${vo2.toFixed(1)} ml/kg/min`;
        classification = vo2 > 40 ? 'Bueno' : vo2 > 30 ? 'Medio' : 'Pobre';
        break;
      }

      case 'Test de Dominadas Estrictas (Pull-Ups)': {
        rawScore = `${reps} reps`;
        const labels = ['Excelente', 'Bueno', 'Medio', 'Regular', 'Pobre'];
        if (gender === 'M') {
          if (age < 26) classification = evaluateRange(reps, [19, 14, 9, 5], labels);
          else if (age < 36) classification = evaluateRange(reps, [17, 12, 8, 4], labels);
          else if (age < 46) classification = evaluateRange(reps, [14, 10, 6, 3], labels);
          else if (age < 56) classification = evaluateRange(reps, [11, 8, 5, 2], labels);
          else classification = evaluateRange(reps, [9, 6, 3, 1], labels);
        } else {
          if (age < 30) classification = evaluateRange(reps, [8, 5, 2, 1], labels);
          else if (age < 40) classification = evaluateRange(reps, [6, 4, 2, 1], labels);
          else if (age < 50) classification = evaluateRange(reps, [5, 3, 1, 0], labels);
          else classification = evaluateRange(reps, [4, 2, 1, 0], labels);
        }
        break;
      }

      case 'Salto Horizontal a Pies Juntos (Broad Jump)': {
        rawScore = `${distance} cm`;
        const labels = ['Excelente', 'Bueno', 'Medio', 'Regular', 'Pobre'];
        if (gender === 'M') {
          if (age < 26) classification = evaluateRange(distance, [250, 231, 211, 191], labels);
          else if (age < 36) classification = evaluateRange(distance, [240, 221, 201, 181], labels);
          else if (age < 46) classification = evaluateRange(distance, [225, 206, 186, 166], labels);
          else if (age < 56) classification = evaluateRange(distance, [210, 191, 171, 151], labels);
          else classification = evaluateRange(distance, [190, 171, 151, 131], labels);
        } else {
          if (age < 26) classification = evaluateRange(distance, [200, 181, 161, 141], labels);
          else if (age < 36) classification = evaluateRange(distance, [190, 171, 151, 131], labels);
          else if (age < 46) classification = evaluateRange(distance, [175, 156, 136, 116], labels);
          else if (age < 56) classification = evaluateRange(distance, [160, 141, 121, 101], labels);
          else classification = evaluateRange(distance, [140, 121, 101, 81], labels);
        }
        break;
      }

      case 'Salto Vertical de Sargent / CMJ': {
        rawScore = `${distance} cm`;
        const labels = ['Excelente', 'Bueno', 'Medio', 'Regular', 'Pobre'];
        if (gender === 'M') {
          if (age < 30) classification = evaluateRange(distance, [65, 55, 45, 35], labels);
          else if (age < 40) classification = evaluateRange(distance, [58, 48, 38, 28], labels);
          else if (age < 50) classification = evaluateRange(distance, [51, 41, 32, 22], labels);
          else classification = evaluateRange(distance, [43, 35, 26, 17], labels);
        } else {
          if (age < 30) classification = evaluateRange(distance, [50, 41, 31, 22], labels);
          else if (age < 40) classification = evaluateRange(distance, [43, 34, 25, 17], labels);
          else if (age < 50) classification = evaluateRange(distance, [36, 28, 20, 12], labels);
          else classification = evaluateRange(distance, [30, 22, 15, 8], labels);
        }
        break;
      }

      case 'Test de Rascarse la Espalda (Back Scratch Test)': {
        rawScore = `${distance} cm`;
        const labels = ['Por encima de lo normal', 'Rango Normal', 'Por debajo de lo normal'];
        if (gender === 'M') {
          if (age < 60)
            classification = evaluateRange(distance, [5.1, 0], labels); // 0 to 5 normal
          else if (age < 65) classification = evaluateRange(distance, [1.3, -16.5], labels);
          else if (age < 70) classification = evaluateRange(distance, [-2.4, -19.0], labels);
          else if (age < 75) classification = evaluateRange(distance, [-2.4, -20.3], labels);
          else if (age < 80) classification = evaluateRange(distance, [-5.0, -23.0], labels);
          else if (age < 85) classification = evaluateRange(distance, [-5.0, -24.1], labels);
          else classification = evaluateRange(distance, [-7.5, -28.0], labels);
        } else {
          if (age < 60) classification = evaluateRange(distance, [5.1, 0], labels);
          else if (age < 65) classification = evaluateRange(distance, [3.9, -7.6], labels);
          else if (age < 70) classification = evaluateRange(distance, [3.9, -8.9], labels);
          else if (age < 75) classification = evaluateRange(distance, [2.6, -11.4], labels);
          else if (age < 80) classification = evaluateRange(distance, [1.3, -12.7], labels);
          else if (age < 85) classification = evaluateRange(distance, [0.1, -15.2], labels);
          else classification = evaluateRange(distance, [-2.4, -17.8], labels);
        }
        break;
      }

      case 'Test de Apoyo Unipodal (Flamingo / SLS)': {
        const totalSecs = timeMin * 60 + timeSec;
        rawScore = `${totalSecs} s`;
        const isClosed = inputs.eyesClosed;
        // Default to OA values
        let threshold = 43;
        if (age < 40) threshold = isClosed ? 28 : 43;
        else if (age < 50) threshold = isClosed ? 18 : 40;
        else if (age < 60) threshold = isClosed ? 9 : 36;
        else if (age < 70) threshold = isClosed ? 4 : 25;
        else threshold = isClosed ? 2 : 15;

        classification = totalSecs >= threshold ? 'Rango Normal' : 'Por debajo de lo normal';
        break;
      }

      case 'Lanzamiento de Balón Medicinal Sentado': {
        rawScore = `${distance} m`;
        const labels = ['Excelente', 'Bueno', 'Medio', 'Pobre'];
        if (gender === 'M') {
          if (age < 30) classification = evaluateRange(distance, [7.0, 5.8, 4.5], labels);
          else if (age < 40) classification = evaluateRange(distance, [6.7, 5.5, 4.2], labels);
          else if (age < 50) classification = evaluateRange(distance, [6.3, 5.1, 3.8], labels);
          else classification = evaluateRange(distance, [5.7, 4.6, 3.4], labels);
        } else {
          if (age < 30) classification = evaluateRange(distance, [5.7, 4.7, 3.6], labels);
          else if (age < 40) classification = evaluateRange(distance, [5.4, 4.4, 3.3], labels);
          else if (age < 50) classification = evaluateRange(distance, [5.0, 4.0, 3.0], labels);
          else classification = evaluateRange(distance, [4.5, 3.6, 2.6], labels);
        }
        break;
      }

      default:
        rawScore = 'Registrado';
        classification = 'Ver Tabla Manual';
        break;
    }
  } catch {
    rawScore = 'Error en cálculo';
    classification = 'N/A';
  }

  return {
    rawScore,
    classification,
    color: COLORS[classification] ?? COLORS['N/A']!,
  };
};
