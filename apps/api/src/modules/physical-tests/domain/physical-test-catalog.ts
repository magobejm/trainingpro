/* eslint-disable max-lines */
export type PhysicalTestCatalogEntry = {
  code: string;
  category: string;
  name: string;
  level: string;
  objective: string;
  whatToDo: string;
  whatToMeasure: string;
  options: {
    economic: string;
    pro: string;
  };
  normTables?: Array<{
    title?: string;
    headers?: string[];
    rows?: Array<{ label?: string; values?: Array<string | number> }>;
  }> | null;
};

export const PHYSICAL_TEST_CATALOG: PhysicalTestCatalogEntry[] = [
  {
    code: 'plank-1',
    category: 'Fuerza-Resistencia Muscular',
    name: 'Test de Resistencia de Plancha Isométrica (Plank Test)',
    level: 'Intermedio',
    objective: 'Evalúa la resistencia isométrica de la musculatura del core.',
    whatToDo:
      'El sujeto se coloca en posición de plancha. El cuerpo debe formar una línea recta. Finaliza cuando el sujeto no puede mantener la postura recta (hasta el fallo).',
    whatToMeasure: 'Tiempo total mantenido con postura correcta.',
    options: {
      economic: 'Cronómetro y esterilla.',
      pro: 'Cronómetro y esterilla con análisis de video.',
    },
    normTables: [
      {
        title: 'Hombres — Tiempo mantenido en segundos (s)',
        headers: ['Edad', 'Pobre', 'Regular', 'Medio', 'Bueno', 'Excelente'],
        rows: [
          { label: '18–29', values: ['< 45', '45–74', '75–104', '105–134', '≥ 135'] },
          { label: '30–39', values: ['< 40', '40–64', '65–89', '90–119', '≥ 120'] },
          { label: '40–49', values: ['< 35', '35–54', '55–79', '80–104', '≥ 105'] },
          { label: '50–59', values: ['< 30', '30–44', '45–64', '65–89', '≥ 90'] },
          { label: '≥ 60', values: ['< 20', '20–34', '35–49', '50–69', '≥ 70'] },
        ],
      },
      {
        title: 'Mujeres — Tiempo mantenido en segundos (s)',
        headers: ['Edad', 'Pobre', 'Regular', 'Medio', 'Bueno', 'Excelente'],
        rows: [
          { label: '18–29', values: ['< 35', '35–59', '60–89', '90–119', '≥ 120'] },
          { label: '30–39', values: ['< 30', '30–49', '50–74', '75–99', '≥ 100'] },
          { label: '40–49', values: ['< 25', '25–44', '45–64', '65–84', '≥ 85'] },
          { label: '50–59', values: ['< 20', '20–34', '35–49', '50–69', '≥ 70'] },
          { label: '≥ 60', values: ['< 15', '15–24', '25–39', '40–54', '≥ 55'] },
        ],
      },
    ],
  },
  {
    code: 'balon-1',
    category: 'Fuerza-Potencia (Explosiva)',
    name: 'Lanzamiento de Balón Medicinal Sentado',
    level: 'Principiante',
    objective: 'Evalúa la potencia explosiva del tren superior.',
    whatToDo:
      'El sujeto se sienta con la espalda apoyada en la pared. Sostiene el balón con ambas manos a la altura del pecho. Empuja el balón hacia adelante con máxima fuerza.',
    whatToMeasure: 'Distancia alcanzada en metros.',
    options: {
      economic: 'Cinta métrica, Balón medicinal (3 kg H, 2 kg M), Silla o pared.',
      pro: 'Plataforma de fuerza o radar de velocidad.',
    },
    normTables: [
      {
        title: 'Hombres — Distancia en metros (Balón 3 kg)',
        headers: ['Edad', 'Pobre', 'Medio', 'Bueno', 'Excelente'],
        rows: [
          { label: '18–29', values: ['< 4.5', '4.5–5.7', '5.8–6.9', '> 7.0'] },
          { label: '30–39', values: ['< 4.2', '4.2–5.4', '5.5–6.6', '> 6.7'] },
          { label: '40–49', values: ['< 3.8', '3.8–5.0', '5.1–6.2', '> 6.3'] },
          { label: '≥ 50', values: ['< 3.4', '3.4–4.5', '4.6–5.6', '> 5.7'] },
        ],
      },
      {
        title: 'Mujeres — Distancia en metros (Balón 2 kg)',
        headers: ['Edad', 'Pobre', 'Medio', 'Bueno', 'Excelente'],
        rows: [
          { label: '18–29', values: ['< 3.6', '3.6–4.6', '4.7–5.6', '> 5.7'] },
          { label: '30–39', values: ['< 3.3', '3.3–4.3', '4.4–5.3', '> 5.4'] },
          { label: '40–49', values: ['< 3.0', '3.0–3.9', '4.0–4.9', '> 5.0'] },
          { label: '≥ 50', values: ['< 2.6', '2.6–3.5', '3.6–4.4', '> 4.5'] },
        ],
      },
    ],
  },
  {
    code: 'test_1',
    category: 'Resistencia Cardiorrespiratoria',
    name: 'Test de Caminata de Rockport (1 milla)',
    level: 'Principiante',
    objective: 'Estimar el VO₂ máx en personas sedentarias o que no pueden correr por impacto.',
    whatToDo:
      'Realizar la prueba descansado, en una pista de atletismo o terreno completamente plano medido exactamente a 1.609 metros (1 milla). Caminar lo más rápido posible de forma constante sin trotar ni correr en ningún momento.',
    whatToMeasure:
      'Registrar el tiempo total exacto al cruzar la meta y la Frecuencia Cardíaca (FC) inmediatamente en los primeros 10-15 segundos post-esfuerzo.',
    options: {
      economic:
        'Cronómetro del móvil + toma manual de pulso radial/carotídeo (contar latidos durante 15 segundos y multiplicar por 4).',
      pro: 'Reloj GPS con banda de pecho de telemetría (tipo Polar H10/Garmin HRM) o analizador portátil de gases metabólicos (ergoespirometría de campo).',
    },
    normTables: [
      {
        title: 'Ecuación Normativa de Rockport',
        headers: ['Formula'],
        rows: [
          {
            label:
              'VO₂ máx = 132.853 - (0.0769 × Peso) - (0.3877 × Edad) + (6.315 × Sexo) - (3.2649 × Tiempo) - (0.1565 × FC final)',
            values: [],
          },
        ],
      },
    ],
  },
  {
    code: 'test_2',
    category: 'Resistencia Cardiorrespiratoria',
    name: 'Test del Escalón de 3 Minutos del YMCA',
    level: 'Principiante',
    objective: 'Evaluar la recuperación cardíaca y eficiencia aeróbica submáxima.',
    whatToDo:
      'Subir y bajar un escalón o cajón de 30.5 cm (12") durante 3:00 minutos seguidos siguiendo un metrónomo fijado en 96 bpm (ritmo de 24 ciclos completos por minuto: sube-sube-baja-baja). Al terminar los 3 minutos, sentarse de inmediato.',
    whatToMeasure:
      'Medir la frecuencia cardíaca durante el primer minuto completo de recuperación (desde el segundo 0 hasta el 60 tras parar).',
    options: {
      economic:
        'Escalón de casa o cajón estándar + app gratuita de metrónomo en el móvil + toma de pulso manual durante 60 segundos completos.',
      pro: 'Cajón ergonómico calibrado + banda torácica de ECG en tiempo real o pulsioxímetro médico continuo con registro de curva de recuperación.',
    },
    normTables: [
      {
        title: 'Hombres — FC de recuperación a 1 min (ppm)',
        headers: ['Edad', 'Excelente', 'Bueno', '+ Media', 'Media', '- Media', 'Pobre', 'Muy Pobre'],
        rows: [
          { label: '18–25', values: ['50–70', '71–80', '81–88', '89–95', '96–102', '103–111', '112–157'] },
          { label: '26–35', values: ['51–76', '77–85', '86–91', '92–99', '100–107', '108–117', '118–160'] },
          { label: '36–45', values: ['49–76', '77–88', '89–95', '96–103', '104–112', '113–119', '120–163'] },
          { label: '46–55', values: ['56–82', '83–91', '92–98', '99–105', '106–116', '117–122', '123–165'] },
          { label: '56–65', values: ['60–84', '85–94', '95–100', '101–107', '108–117', '118–122', '123–167'] },
          { label: '> 65', values: ['59–88', '89–96', '97–102', '103–111', '112–119', '120–127', '128–168'] },
        ],
      },
      {
        title: 'Mujeres — FC de recuperación a 1 min (ppm)',
        headers: ['Edad', 'Excelente', 'Bueno', '+ Media', 'Media', '- Media', 'Pobre', 'Muy Pobre'],
        rows: [
          { label: '18–25', values: ['54–78', '79–86', '87–97', '98–103', '104–110', '111–118', '119–162'] },
          { label: '26–35', values: ['60–80', '81–89', '90–99', '100–107', '108–117', '118–126', '127–167'] },
          { label: '36–45', values: ['64–85', '86–94', '95–102', '103–110', '111–118', '119–128', '129–171'] },
          { label: '46–55', values: ['64–88', '89–97', '98–105', '106–115', '116–121', '122–129', '130–172'] },
          { label: '56–65', values: ['64–90', '91–98', '99–106', '107–114', '115–122', '123–129', '130–174'] },
          { label: '> 65', values: ['65–92', '93–101', '102–109', '110–116', '117–123', '124–131', '132–175'] },
        ],
      },
    ],
  },
  {
    code: 'test_3',
    category: 'Resistencia Cardiorrespiratoria',
    name: 'Test Submáximo en Cicloergómetro (YMCA)',
    level: 'Intermedio',
    objective: 'Estimar VO₂ máx y potencia aeróbica en bicicleta estática.',
    whatToDo:
      'Pedalear a cadencia fija de 50 rpm. Se realizan etapas de 3 minutos incrementando la carga progresivamente en función de la respuesta de la FC, buscando alcanzar el 85% de la FC máxima teórica.',
    whatToMeasure: 'Registrar la FC y los vatios/kilopondios en el último minuto de cada etapa de 3 minutos.',
    options: {
      economic:
        'Bicicleta estática del gimnasio o rodillo inteligente con potenciómetro + toma manual de pulso o sensor del manillar.',
      pro: 'Cicloergómetro electromagnético calibrado (Monark / Lode) + pulsómetro telemétrico continuo de 12 derivaciones o máscara de intercambio de gases (Cortex/Cosmed).',
    },
    normTables: [
      {
        title: 'Cálculo del VO₂ máx (ACSM)',
        headers: ['Formula'],
        rows: [
          {
            label: 'VO₂ máx (ml/kg/min) = [ 1.8 × Carga Estimada (kgm/min) / Peso (kg) ] + 7',
            values: [],
          },
        ],
      },
    ],
  },
  {
    code: 'test_4',
    category: 'Resistencia Cardiorrespiratoria',
    name: 'Test de Cooper (12 Minutos)',
    level: 'Intermedio',
    objective: 'Estimar VO₂ máx y resistencia aeróbica continua.',
    whatToDo: 'Correr la máxima distancia posible durante exactamente 12 minutos a ritmo uniforme en terreno llano.',
    whatToMeasure: 'Distancia total recorrida en metros al sonar el cronómetro de los 12:00 minutos.',
    options: {
      economic: 'Pista de atletismo de 400 m (contar vueltas + metros parciales) con cronómetro del móvil.',
      pro: 'Reloj con sensor GPS de doble frecuencia o cinta de correr ergonómica calibrada con encoder de velocidad y software de monitorización.',
    },
    normTables: [
      {
        title: 'Hombres — Distancia recorrida en metros',
        headers: ['Edad', 'Muy Pobre', 'Pobre', 'Regular', 'Bueno', 'Excelente', 'Superior'],
        rows: [
          { label: '20–29', values: ['< 1960', '1960–2199', '2200–2399', '2400–2639', '2640–2839', '≥ 2840'] },
          { label: '30–39', values: ['< 1900', '1900–2099', '2100–2299', '2300–2519', '2520–2719', '≥ 2720'] },
          { label: '40–49', values: ['< 1830', '1830–1999', '2000–2199', '2200–2439', '2440–2649', '≥ 2650'] },
          { label: '50–59', values: ['< 1650', '1650–1869', '1870–2099', '2100–2319', '2320–2539', '≥ 2540'] },
          { label: '≥ 60', values: ['< 1400', '1400–1649', '1650–1929', '1930–2119', '2120–2359', '≥ 2360'] },
        ],
      },
      {
        title: 'Mujeres — Distancia recorrida en metros',
        headers: ['Edad', 'Muy Pobre', 'Pobre', 'Regular', 'Bueno', 'Excelente', 'Superior'],
        rows: [
          { label: '20–29', values: ['< 1550', '1550–1789', '1790–1969', '1970–2159', '2160–2329', '≥ 2330'] },
          { label: '30–39', values: ['< 1510', '1510–1689', '1690–1899', '1900–2079', '2080–2239', '≥ 2240'] },
          { label: '40–49', values: ['< 1410', '1410–1579', '1580–1789', '1790–1999', '2000–2159', '≥ 2160'] },
          { label: '50–59', values: ['< 1350', '1350–1499', '1500–1689', '1690–1899', '1900–2089', '≥ 2090'] },
          { label: '≥ 60', values: ['< 1260', '1260–1389', '1390–1589', '1590–1749', '1750–1909', '≥ 1910'] },
        ],
      },
    ],
  },
  {
    code: 'test_5',
    category: 'Resistencia Cardiorrespiratoria',
    name: 'Test de Course-Navette (20 m Shuttle Run)',
    level: 'Avanzado',
    objective: 'Determinar la Velocidad Aeróbica Máxima (VAM) y VO₂ máx máximo.',
    whatToDo:
      'Correr en ida y vuelta sobre un tramo recto de 20 metros delimitado, pisando la línea en sincronía con los pitidos de un audio oficial que incrementa el ritmo cada minuto (palier).',
    whatToMeasure:
      'Anotar el último período (palier) y medio-palier completado antes de no llegar a la línea a tiempo en dos pitidos consecutivos.',
    options: {
      economic: '2 conos + cinta métrica + audio oficial reproducido desde el móvil.',
      pro: 'Células fotoeléctricas / fotocélulas en las líneas de viraje + ergoespirometría telemétrica portátil para consumo directo de oxígeno.',
    },
    normTables: [
      {
        title: 'Hombres — Palier alcanzado',
        headers: ['Edad', 'Pobre', 'Regular', 'Medio', 'Bueno', 'Excelente'],
        rows: [
          { label: '20–29', values: ['< 6.0', '6.0–7.5', '8.0–10.0', '10.5–12.0', '> 12.0'] },
          { label: '30–39', values: ['< 5.0', '5.0–6.5', '7.0–9.0', '9.5–11.0', '> 11.0'] },
          { label: '40–49', values: ['< 4.0', '4.0–5.5', '6.0–8.0', '8.5–10.0', '> 10.0'] },
          { label: '≥ 50', values: ['< 3.0', '3.0–4.5', '5.0–6.5', '7.0–8.5', '> 8.5'] },
        ],
      },
      {
        title: 'Mujeres — Palier alcanzado',
        headers: ['Edad', 'Pobre', 'Regular', 'Medio', 'Bueno', 'Excelente'],
        rows: [
          { label: '20–29', values: ['< 4.5', '4.5–5.5', '6.0–7.5', '8.0–9.5', '> 9.5'] },
          { label: '30–39', values: ['< 3.5', '3.5–4.5', '5.0–6.5', '7.0–8.5', '> 8.5'] },
          { label: '40–49', values: ['< 2.5', '2.5–3.5', '4.0–5.5', '6.0–7.0', '> 7.0'] },
          { label: '≥ 50', values: ['< 2.0', '2.0–3.0', '3.5–4.5', '5.0–6.0', '> 6.0'] },
        ],
      },
    ],
  },
  {
    code: 'test_6',
    category: 'Fuerza-Resistencia Muscular',
    name: 'Test de Sentarse y Levantarse en 30 s (30-s Chair Stand)',
    level: 'Principiante',
    objective: 'Evaluar la fuerza-resistencia funcional del tren inferior.',
    whatToDo:
      'Sentado en una silla de 43-44 cm de altura sin brazos, con brazos cruzados sobre el pecho. Levantarse hasta extensión completa y volver a sentarse tantas veces como sea posible en 30 segundos.',
    whatToMeasure: 'Contar el número de repeticiones completadas con técnica estricta al cumplirse los 30 segundos.',
    options: {
      economic:
        'Silla de casa contra la pared + cronómetro del teléfono (opcional grabarse con el móvil para validar rango).',
      pro: 'Sensor de velocidad lineal/encoder (Vitruve, Speed4Lifts) fijado a la cadera o alfombrilla de contacto para medir velocidad media propulsiva y pérdida de potencia repetición a repetición.',
    },
    normTables: [
      {
        title: 'Rango Normal (Adultos Mayores) — Repeticiones en 30 segundos',
        headers: ['Edad', 'Hombres', 'Mujeres'],
        rows: [
          { label: '60–64', values: ['14–19', '12–17'] },
          { label: '65–69', values: ['12–18', '11–16'] },
          { label: '70–74', values: ['12–17', '10–15'] },
          { label: '75–79', values: ['11–17', '10–15'] },
          { label: '80–84', values: ['10–15', '9–14'] },
          { label: '85–89', values: ['8–14', '8–13'] },
          { label: '90–94', values: ['7–12', '4–11'] },
        ],
      },
    ],
  },
  {
    code: 'test_7',
    category: 'Fuerza-Resistencia Muscular',
    name: 'Test de Flexiones (Push-Up Test)',
    level: 'Principiante (en rodillas) / Intermedio (estándar)',
    objective: 'Medir fuerza-resistencia de empuje horizontal y estabilidad del core.',
    whatToDo:
      'Realizar repeticiones continuas tocando con el pecho un objeto de 5-7 cm en el suelo (o el puño de un compañero) y extendiendo codos por completo. Sin pausas mayores a 2 segundos.',
    whatToMeasure: 'Número total de repeticiones estrictas alcanzadas hasta el fallo muscular o pérdida de técnica lumbar.',
    options: {
      economic: 'Toalla enrollada o taco de yoga bajo el pecho para fijar profundidad + grabación lateral con smartphone.',
      pro: 'Plataforma dinamométrica de contacto en suelo o transductor de posición lineal acoplado para medir potencia media y fatiga neuromuscular.',
    },
    normTables: [
      {
        title: 'Hombres — Repeticiones estrictas sobre pies',
        headers: ['Edad', 'Excelente', 'Bueno', 'Medio', 'Regular', 'Pobre'],
        rows: [
          { label: '20–29', values: ['≥ 36', '29–35', '22–28', '17–21', '≤ 16'] },
          { label: '30–39', values: ['≥ 30', '22–29', '17–21', '12–16', '≤ 11'] },
          { label: '40–49', values: ['≥ 25', '17–24', '13–16', '10–12', '≤ 9'] },
          { label: '50–59', values: ['≥ 21', '13–20', '10–12', '7–9', '≤ 6'] },
          { label: '60–69', values: ['≥ 18', '11–17', '8–10', '5–7', '≤ 4'] },
        ],
      },
      {
        title: 'Mujeres — Repeticiones modificadas sobre rodillas',
        headers: ['Edad', 'Excelente', 'Bueno', 'Medio', 'Regular', 'Pobre'],
        rows: [
          { label: '20–29', values: ['≥ 30', '21–29', '15–20', '10–14', '≤ 9'] },
          { label: '30–39', values: ['≥ 27', '20–26', '13–19', '8–12', '≤ 7'] },
          { label: '40–49', values: ['≥ 24', '15–23', '11–14', '5–10', '≤ 4'] },
          { label: '50–59', values: ['≥ 21', '11–20', '7–10', '2–6', '≤ 1'] },
          { label: '60–69', values: ['≥ 17', '12–16', '5–11', '1–4', '0'] },
        ],
      },
    ],
  },
  {
    code: 'test_8',
    category: 'Fuerza-Resistencia Muscular',
    name: 'Test de Dominadas Estrictas (Pull-Ups)',
    level: 'Avanzado',
    objective: 'Evaluar la fuerza-resistencia de tracción vertical relativa al peso corporal.',
    whatToDo:
      'Colgarse con agarre prono y brazos estirados. Traccionar hasta superar la barra con la barbilla sin balancear las piernas ni usar impulso.',
    whatToMeasure: 'Número total de repeticiones completas antes de soltarse de la barra.',
    options: {
      economic: 'Barra de dominadas estándar en parque o casa + cámara del móvil para revisar rango.',
      pro: 'Encoder lineal/acelerómetro triaxial fijado al cinturón para registrar pérdida de velocidad de tracción repetición a repetición.',
    },
    normTables: [
      {
        title: 'Hombres — Repeticiones pronas estrictas',
        headers: ['Edad', 'Pobre', 'Regular', 'Medio', 'Bueno', 'Excelente'],
        rows: [
          { label: '18–25', values: ['≤ 4', '5–8', '9–13', '14–18', '≥ 19'] },
          { label: '26–35', values: ['≤ 3', '4–7', '8–11', '12–16', '≥ 17'] },
          { label: '36–45', values: ['≤ 2', '3–5', '6–9', '10–13', '≥ 14'] },
          { label: '46–55', values: ['≤ 1', '2–4', '5–7', '8–10', '≥ 11'] },
          { label: '≥ 56', values: ['0', '1–2', '3–5', '6–8', '≥ 9'] },
        ],
      },
      {
        title: 'Mujeres — Repeticiones pronas estrictas',
        headers: ['Edad', 'Pobre', 'Regular', 'Medio', 'Bueno', 'Excelente'],
        rows: [
          { label: '18–29', values: ['0', '1', '2–4', '5–7', '≥ 8'] },
          { label: '30–39', values: ['0', '1', '2–3', '4–5', '≥ 6'] },
          { label: '40–49', values: ['0', '0', '1–2', '3–4', '≥ 5'] },
          { label: '≥ 50', values: ['0', '0', '1', '2–3', '≥ 4'] },
        ],
      },
    ],
  },
  {
    code: 'test_9',
    category: 'Fuerza-Potencia (Explosiva)',
    name: 'Salto Horizontal a Pies Juntos (Broad Jump)',
    level: 'Intermedio',
    objective: 'Medir potencia explosiva horizontal de extensión de cadera y rodilla.',
    whatToDo:
      'Situarse tras la línea de batida con pies al ancho de hombros. Flexionar piernas y balancear brazos para saltar lo más lejos posible, aterrizando con ambos pies a la vez y sin desequilibrarse hacia atrás.',
    whatToMeasure:
      'Medir la distancia desde la línea de despegue hasta la parte posterior del talón más retrasado en el aterrizaje. Registrar el mejor de 3 intentos.',
    options: {
      economic: 'Cinta métrica pegada al suelo + marcas con cinta de carrocero.',
      pro: 'Alfombra de salto métrica graduada o pasillo de doble plataforma de fuerza para cuantificar vector horizontal de fuerza y frenado.',
    },
    normTables: [
      {
        title: 'Hombres — Distancia en centímetros (cm)',
        headers: ['Edad', 'Pobre', 'Regular', 'Medio', 'Bueno', 'Excelente'],
        rows: [
          { label: '18–25', values: ['< 191', '191–210', '211–230', '231–250', '> 250'] },
          { label: '26–35', values: ['< 181', '181–200', '201–220', '221–240', '> 240'] },
          { label: '36–45', values: ['< 166', '166–185', '186–205', '206–225', '> 225'] },
          { label: '46–55', values: ['< 151', '151–170', '171–190', '191–210', '> 210'] },
          { label: '≥ 56', values: ['< 131', '131–150', '151–170', '171–190', '> 190'] },
        ],
      },
      {
        title: 'Mujeres — Distancia en centímetros (cm)',
        headers: ['Edad', 'Pobre', 'Regular', 'Medio', 'Bueno', 'Excelente'],
        rows: [
          { label: '18–25', values: ['< 141', '141–160', '161–180', '181–200', '> 200'] },
          { label: '26–35', values: ['< 131', '131–150', '151–170', '171–190', '> 190'] },
          { label: '36–45', values: ['< 116', '116–135', '136–155', '156–175', '> 175'] },
          { label: '46–55', values: ['< 101', '101–120', '121–140', '141–160', '> 160'] },
          { label: '≥ 56', values: ['< 81', '81–100', '101–120', '121–140', '> 140'] },
        ],
      },
    ],
  },
  {
    code: 'test_10',
    category: 'Fuerza-Potencia (Explosiva)',
    name: 'Salto Vertical de Sargent / CMJ',
    level: 'Avanzado',
    objective: 'Evaluar potencia explosiva vertical de miembros inferiores.',
    whatToDo: 'Realizar un salto vertical con contramovimiento (CMJ) buscando la máxima altura posible.',
    whatToMeasure:
      'Altura neta de salto en centímetros (altura máxima alcanzada menos altura de alcance estático con brazo extendido).',
    options: {
      economic: 'Puntas de los dedos marcadas con tiza contra una pared lisa o cinta métrica vertical pegada a la pared.',
      pro: 'Plataforma de salto de infrarrojos/contacto (Optojump), app de alta velocidad validada (MyJump con 240 fps) o Plataformas de Fuerza piezoeléctricas duales (ForceDecks/Kistler) para medir tasa de desarrollo de fuerza (RFD) y tiempo de vuelo.',
    },
    normTables: [
      {
        title: 'Hombres — Diferencia de altura neta (cm)',
        headers: ['Nivel', '20–29', '30–39', '40–49', '50–59'],
        rows: [
          { label: 'Excelente', values: ['> 65', '> 58', '> 51', '> 43'] },
          { label: 'Bueno', values: ['55–65', '48–58', '41–51', '35–43'] },
          { label: 'Medio', values: ['45–54', '38–47', '32–40', '26–34'] },
          { label: 'Regular', values: ['35–44', '28–37', '22–31', '17–25'] },
          { label: 'Pobre', values: ['< 35', '< 28', '< 22', '< 17'] },
        ],
      },
      {
        title: 'Mujeres — Diferencia de altura neta (cm)',
        headers: ['Nivel', '20–29', '30–39', '40–49', '50–59'],
        rows: [
          { label: 'Excelente', values: ['> 50', '> 43', '> 36', '> 30'] },
          { label: 'Bueno', values: ['41–50', '34–43', '28–36', '22–30'] },
          { label: 'Medio', values: ['31–40', '25–33', '20–27', '15–21'] },
          { label: 'Regular', values: ['22–30', '17–24', '12–19', '8–14'] },
          { label: 'Pobre', values: ['< 22', '< 17', '< 12', '< 8'] },
        ],
      },
    ],
  },
  {
    code: 'test_11',
    category: 'Flexibilidad y Movilidad',
    name: 'Test de Rascarse la Espalda (Back Scratch Test)',
    level: 'Principiante',
    objective: 'Evaluar movilidad y rango articular de la cintura escapular y hombros.',
    whatToDo:
      'De pie, llevar una mano por encima del hombro hacia la espalda y la otra por detrás de la cintura hacia arriba, intentando que los dedos medios se toquen.',
    whatToMeasure:
      'Medir la distancia entre las puntas de los dedos medios. Anotar 0 si se tocan, valor positivo (+) en cm si se superponen, o valor negativo (-) si no llegan a tocarse.',
    options: {
      economic: 'Regla de 30 cm o cinta métrica flexible sostenida por un acompañante o comprobada por foto dorsal.',
      pro: 'Goniómetro digital o sistema de fotogrametría 2D/3D con marcadores biomecánicos (Kinovea/Vicon).',
    },
    normTables: [
      {
        title: 'Rango Normal (Adultos Mayores) — Distancia (valores negativos = no llegan, positivos = se superponen)',
        headers: ['Edad', 'Hombres (Normal)', 'Mujeres (Normal)'],
        rows: [
          { label: '60–64', values: ['-16.5 a +1.2 cm', '-7.6 a +3.8 cm'] },
          { label: '65–69', values: ['-19.0 a -2.5 cm', '-8.9 a +3.8 cm'] },
          { label: '70–74', values: ['-20.3 a -2.5 cm', '-11.4 a +2.5 cm'] },
          { label: '75–79', values: ['-23.0 a -5.1 cm', '-12.7 a +1.2 cm'] },
          { label: '80–84', values: ['-24.1 a -5.1 cm', '-15.2 a 0.0 cm'] },
          { label: '≥ 85', values: ['-28.0 a -7.6 cm', '-17.8 a -2.5 cm'] },
        ],
      },
    ],
  },
  {
    code: 'test_12',
    category: 'Flexibilidad y Movilidad',
    name: 'Test de Sit and Reach',
    level: 'Intermedio',
    objective: 'Evaluar extensibilidad de la cadena posterior (isquiosurales y zona lumbar).',
    whatToDo:
      'Sentado en el suelo con piernas estiradas y plantas apoyadas en el cajón. Flexionar el tronco hacia adelante deslizando ambas manos de forma suave y sin rebotes, aguantando 2 segundos la posición final.',
    whatToMeasure: 'Registrar la distancia alcanzada en centímetros sobre la escala milimetrada.',
    options: {
      economic:
        'Regla fijada sobre una caja estándar (con la marca de 23 o 26 cm alineada con el borde donde apoyan los pies).',
      pro: 'Cajón oficial de Sit and Reach (tipo Acuflex) con cursor deslizante milimétrico anti-fricción o inclinómetro digital sobre columna lumbar.',
    },
    normTables: [
      {
        title: 'Hombres — Distancia alcanzada en centímetros (caja a 26cm)',
        headers: ['Edad', 'Pobre', 'Regular', 'Bueno', 'Muy Bueno', 'Excelente'],
        rows: [
          { label: '20–29', values: ['≤ 24', '25–29', '30–33', '34–39', '≥ 40'] },
          { label: '30–39', values: ['≤ 22', '23–27', '28–32', '33–37', '≥ 38'] },
          { label: '40–49', values: ['≤ 17', '18–23', '24–28', '29–34', '≥ 35'] },
          { label: '50–59', values: ['≤ 15', '16–23', '24–27', '28–34', '≥ 35'] },
          { label: '60–69', values: ['≤ 14', '15–19', '20–24', '25–32', '≥ 33'] },
        ],
      },
      {
        title: 'Mujeres — Distancia alcanzada en centímetros (caja a 26cm)',
        headers: ['Edad', 'Pobre', 'Regular', 'Bueno', 'Muy Bueno', 'Excelente'],
        rows: [
          { label: '20–29', values: ['≤ 27', '28–32', '33–36', '37–40', '≥ 41'] },
          { label: '30–39', values: ['≤ 26', '27–31', '32–35', '36–40', '≥ 41'] },
          { label: '40–49', values: ['≤ 24', '25–29', '30–33', '34–37', '≥ 38'] },
          { label: '50–59', values: ['≤ 24', '25–29', '30–32', '33–38', '≥ 39'] },
          { label: '60–69', values: ['≤ 22', '23–26', '27–30', '31–34', '≥ 35'] },
        ],
      },
    ],
  },
  {
    code: 'test_13',
    category: 'Agilidad y Estabilidad',
    name: 'Test de Apoyo Unipodal (Flamingo / SLS)',
    level: 'Principiante',
    objective: 'Evaluar equilibrio estático y propiocepción de cadera y tobillo.',
    whatToDo:
      'Mantenerse descalzo sobre una pierna con las manos en las caderas y la pierna libre flexionada en el aire sin tocar la pierna de apoyo.',
    whatToMeasure:
      'Medir los segundos sostenidos sin apoyar el pie libre, mover el pie de apoyo o soltar las manos (hasta 60 segundos), tanto con ojos abiertos como cerrados.',
    options: {
      economic: 'Cronómetro del móvil + suelo plano antideslizante.',
      pro: 'Plataforma posturográfica de presiones/fuerzas para analizar el centro de presiones (CoP), área de elipse y velocidad de oscilación postural.',
    },
    normTables: [
      {
        title: 'Ambos Sexos — Segundos mantenidos sin apoyo',
        headers: ['Edad', 'Ojos Abiertos (Rango y Media)', 'Ojos Cerrados (Rango y Media)'],
        rows: [
          { label: '18–39', values: ['43–45 s (Media: 44.8 s)', '28–32 s (Media: 30.5 s)'] },
          { label: '40–49', values: ['40–44 s (Media: 42.1 s)', '18–24 s (Media: 21.0 s)'] },
          { label: '50–59', values: ['36–42 s (Media: 39.7 s)', '9–14 s (Media: 11.8 s)'] },
          { label: '60–69', values: ['25–33 s (Media: 28.5 s)', '4–7 s (Media: 5.6 s)'] },
          { label: '70–79', values: ['15–22 s (Media: 18.3 s)', '2–4 s (Media: 3.1 s)'] },
        ],
      },
    ],
  },
  {
    code: 'test_14',
    category: 'Agilidad y Estabilidad',
    name: 'Test Pro Agility 5-10-5 (20-Yard Shuttle)',
    level: 'Avanzado',
    objective: 'Evaluar aceleración lateral, frenado y cambio de dirección rápido.',
    whatToDo:
      'Salir desde el centro: esprintar 4.57 m a la derecha (tocar línea con mano derecha), girar 180° y esprintar 9.14 m a la izquierda (tocar línea con mano izquierda), y girar para esprintar 4.57 m cruzando la línea central.',
    whatToMeasure: 'Tiempo total en centésimas de segundo desde la salida hasta cruzar la línea del cono central.',
    options: {
      economic: '3 conos separados a 4.57 m + cronómetro manual activado por un ayudante o grabación en vídeo.',
      pro: 'Puertas de fotocélulas electrónicas sincronizadas por radiofrecuencia (Smartspeed / Brower Timing Systems) para eliminar el error humano en el cronometraje.',
    },
    normTables: [
      {
        title: 'Hombres — Tiempo en segundos',
        headers: ['Nivel', 'Excelente / Élite', 'Bueno', 'Medio', 'Pobre'],
        rows: [
          { label: 'Recreacional', values: ['< 4.50 s', '4.50–4.79 s', '4.80–5.19 s', '> 5.20 s'] },
          { label: 'Universitarios / Avanzados', values: ['< 4.20 s', '4.20–4.39 s', '4.40–4.65 s', '> 4.65 s'] },
        ],
      },
      {
        title: 'Mujeres — Tiempo en segundos',
        headers: ['Nivel', 'Excelente / Élite', 'Bueno', 'Medio', 'Pobre'],
        rows: [
          { label: 'Recreacional', values: ['< 4.90 s', '4.90–5.19 s', '5.20–5.59 s', '> 5.60 s'] },
          { label: 'Universitarias / Avanzadas', values: ['< 4.45 s', '4.45–4.69 s', '4.70–5.00 s', '> 5.00 s'] },
        ],
      },
    ],
  },
];
