export type SportSeedExercise = {
  name: string;
  sportType: string;
  movementPattern: string;
  anatomicalPlane: string;
  description: string;
  instructions: string;
};

export const SPORT_EXERCISES: SportSeedExercise[] = [
  {
    name: 'Arrancada (Snatch)',
    sportType: 'Halterofilia',
    movementPattern: 'bisagra de cadera',
    anatomicalPlane: 'sagital',
    description:
      'Levantamiento de la barra desde el suelo hasta por encima de la cabeza en un solo movimiento' +
      ' fluido y explosivo. Es el ejercicio de máxima potencia por excelencia.',
    instructions:
      '• Mantén la barra siempre pegada a las espinillas y muslos durante el tirón.' +
      ' | • Asegura una recepción estable con los brazos bloqueados y la espalda activa en la sentadilla.',
  },
  {
    name: 'Dos tiempos (Clean & Jerk)',
    sportType: 'Halterofilia',
    movementPattern: 'bisagra de cadera',
    anatomicalPlane: 'sagital',
    description:
      'Levantamiento en dos fases: primero se lleva la barra a los hombros (cargada) y luego' +
      ' se empuja sobre la cabeza (envión). Permite mover cargas máximas.',
    instructions:
      '• En la cargada, los codos deben girar rápido para recibir la barra sobre los hombros.' +
      ' | • Mantén el tronco vertical antes de iniciar el impulso de piernas para el jerk.',
  },
  {
    name: 'Power Clean',
    sportType: 'Halterofilia',
    movementPattern: 'bisagra de cadera',
    anatomicalPlane: 'sagital',
    description:
      'Variante de la cargada donde la barra se recibe en una posición de media sentadilla,' +
      ' sin bajar hasta el fondo. Enfatiza la potencia de extensión.',
    instructions:
      '• El contacto de la barra debe producirse en el tercio superior del muslo.' +
      ' | • Asegura que los pies se desplacen ligeramente hacia afuera para una base de recepción sólida.',
  },
  {
    name: 'Power Snatch',
    sportType: 'Halterofilia',
    movementPattern: 'bisagra de cadera',
    anatomicalPlane: 'sagital',
    description:
      'Variante de la arrancada donde se recibe la barra con los brazos bloqueados' +
      ' pero sin bajar a sentadilla profunda. Requiere mayor altura de la barra.',
    instructions:
      '• Mantén el pecho alto y la espalda plana durante toda la fase de aceleración inicial.' +
      ' | • Bloquea los codos de forma violenta y simultánea al aterrizar con los pies.',
  },
  {
    name: 'Envión (Jerk)',
    sportType: 'Halterofilia',
    movementPattern: 'empuje vertical',
    anatomicalPlane: 'frontal',
    description:
      'Fase final del Clean & Jerk donde se lanza la barra desde los hombros hasta la extensión' +
      ' completa de brazos. Puede ser en split (tijera) o squat.',
    instructions:
      '• Realiza un dip (flexión de rodillas) corto y explosivo sin inclinar el torso.' +
      ' | • Empuja tu cuerpo hacia abajo de la barra mientras esta sube para asegurar el bloqueo.',
  },
  {
    name: 'Hang Clean',
    sportType: 'Halterofilia',
    movementPattern: 'bisagra de cadera',
    anatomicalPlane: 'sagital',
    description:
      'Cargada realizada iniciando con la barra colgada (sobre las rodillas) en lugar de desde' +
      ' el suelo. Mejora la explosividad de la cadera.',
    instructions:
      '• Inicia el movimiento llevando la cadera atrás hasta que la barra roce la parte alta de la rodilla.' +
      ' | • Mantén los brazos relajados (como cuerdas) hasta el momento del encogimiento de hombros.',
  },
  {
    name: 'Hang Snatch',
    sportType: 'Halterofilia',
    movementPattern: 'bisagra de cadera',
    anatomicalPlane: 'sagital',
    description:
      'Arrancada iniciando con la barra sobre las rodillas. Obliga a generar mucha potencia' +
      ' en un recorrido de aceleración muy corto.',
    instructions:
      '• Mantén el peso repartido en todo el pie; no te vuelques hacia las punteras al bajar la barra.' +
      ' | • La extensión de cadera debe ser completa antes de iniciar el tirón con los brazos.',
  },
  {
    name: 'Overhead Squat',
    sportType: 'Halterofilia',
    movementPattern: 'dominante de rodilla',
    anatomicalPlane: 'sagital',
    description:
      'Sentadilla manteniendo la barra bloqueada sobre la cabeza con un agarre ancho.' +
      ' Es el máximo test de movilidad, estabilidad y equilibrio.',
    instructions:
      '• Empuja la barra hacia el techo constantemente para mantener los hombros activos.' +
      ' | • Mantén la barra alineada con tus talones durante todo el descenso de la cadera.',
  },
  {
    name: 'Tirón de arrancada / cargada',
    sportType: 'Halterofilia',
    movementPattern: 'bisagra de cadera',
    anatomicalPlane: 'sagital',
    description:
      'Ejercicio de asistencia que imita la fase de potencia del Snatch o Clean sin llegar a' +
      ' recibir la barra. Fortalece la extensión y el encogimiento.',
    instructions:
      '• Mantén los brazos estirados hasta que la cadera haya completado su extensión.' +
      ' | • Sube los talones y encoge los hombros de forma simultánea en el punto de máxima potencia.',
  },
  {
    name: 'Muscle Snatch',
    sportType: 'Halterofilia',
    movementPattern: 'bisagra de cadera',
    anatomicalPlane: 'sagital',
    description:
      'Arrancada donde no hay fase de recepción (no se doblan las rodillas para recibir).' +
      ' Se lleva la barra arriba por fuerza de tiro y empuje continuo.',
    instructions:
      '• No permitas que la barra se aleje del cuerpo; debe viajar en una línea vertical estricta.' +
      ' | • Mantén las piernas bloqueadas una vez iniciada la fase de empuje final de brazos.',
  },
  {
    name: 'Split Jerk',
    sportType: 'Halterofilia',
    movementPattern: 'empuje vertical',
    anatomicalPlane: 'frontal',
    description:
      'Envión donde la recepción se hace con un pie adelantado y otro atrasado (tijera).' +
      ' Ofrece la mayor estabilidad bajo cargas pesadas.',
    instructions:
      '• El pie delantero debe dar un paso corto y el trasero quedar sobre la puntera.' +
      ' | • Recupera primero la pierna delantera y luego la trasera para asegurar el control del peso.',
  },
  {
    name: 'Thrusters',
    sportType: 'CrossTraining',
    movementPattern: 'dominante de rodilla',
    anatomicalPlane: 'sagital',
    description:
      'Combinación de una sentadilla frontal profunda con un press de hombros en un solo movimiento' +
      ' continuo. El empuje de piernas lanza la barra arriba.',
    instructions:
      '• No inicies el empuje de brazos hasta que la cadera esté casi totalmente extendida.' +
      ' | • Aprovecha la inercia de la subida de la sentadilla para facilitar el paso de la barra.',
  },
  {
    name: 'Cluster',
    sportType: 'CrossTraining',
    movementPattern: 'dominante de rodilla',
    anatomicalPlane: 'sagital',
    description:
      'Combinación de una cargada (Squat Clean) seguida de un Thruster.' +
      ' Se realiza una repetición completa desde el suelo cada vez.',
    instructions:
      '• Asegura una buena posición de recepción en la sentadilla antes de intentar el empuje vertical.' +
      ' | • Mantén los codos altos en la fase de sentadilla para que la barra no se deslice adelante.',
  },
  {
    name: 'Shoulder to Overhead',
    sportType: 'CrossTraining',
    movementPattern: 'empuje vertical',
    anatomicalPlane: 'frontal',
    description:
      'Cualquier método para llevar la barra desde los hombros hasta sobre la cabeza' +
      ' (Press, Push Press, Push Jerk o Split Jerk).',
    instructions:
      '• Mantén el abdomen muy apretado para evitar que la espalda se arquee bajo la carga.' +
      ' | • Bloquea los codos por completo en la vertical antes de bajar la barra para la siguiente.',
  },
  {
    name: 'Sumo Deadlift High Pull',
    sportType: 'CrossTraining',
    movementPattern: 'bisagra de cadera',
    anatomicalPlane: 'sagital',
    description:
      'Peso muerto con posición de pies ancha y agarre estrecho, terminando con un tirón de' +
      ' la barra hacia la barbilla con codos altos.',
    instructions:
      '• El tirón de brazos debe ser la continuación fluida de la explosión de cadera.' +
      ' | • Mantén los codos siempre por encima del nivel de las muñecas en la parte alta.',
  },
  {
    name: 'Bear Complex',
    sportType: 'CrossTraining',
    movementPattern: 'dominante de rodilla',
    anatomicalPlane: 'sagital',
    description:
      'Complejo que une: Power Clean, Front Squat, Push Press, Back Squat y Push Press tras nuca' +
      ' sin soltar la barra.',
    instructions:
      '• Mantén un ritmo respiratorio constante para evitar la fatiga prematura en este complejo largo.' +
      ' | • Asegura el control de la barra al pasarla por detrás de la cabeza hacia los trapecios.',
  },
  {
    name: 'Dumbbell Snatch',
    sportType: 'CrossTraining',
    movementPattern: 'bisagra de cadera',
    anatomicalPlane: 'sagital',
    description:
      'Arrancada unilateral con mancuerna desde el suelo hasta sobre la cabeza.' +
      ' Ejercicio de potencia y coordinación asimétrica.',
    instructions:
      '• Mantén la mancuerna cerca del centro del cuerpo; no permitas que describa un arco amplio.' +
      ' | • Cambia la mano frente a la cara o en el suelo manteniendo siempre la espalda plana.',
  },
  {
    name: 'Devil Press',
    sportType: 'CrossTraining',
    movementPattern: 'locomocion y transporte',
    anatomicalPlane: 'sagital',
    description:
      'Combinación de un burpee sobre las mancuernas seguido de un movimiento de Snatch doble' +
      ' desde el suelo. Muy exigente metabólicamente.',
    instructions:
      '• Al saltar hacia adelante desde el burpee, abre los pies para dejar espacio a las mancuernas.' +
      ' | • Usa la extensión de cadera de forma explosiva para balancear las pesas sobre la cabeza.',
  },
  {
    name: 'Dumbbell Box Step-overs',
    sportType: 'CrossTraining',
    movementPattern: 'dominante de rodilla',
    anatomicalPlane: 'sagital',
    description:
      'Subir a un cajón con mancuernas y bajar por el lado opuesto.' +
      ' La carga suele llevarse a los lados o sobre los hombros.',
    instructions:
      '• Apoya el pie completo en el cajón y mantén el torso estable durante el tránsito.' +
      ' | • Evita impulsarte con la pierna de abajo; el esfuerzo debe ser de la pierna que está arriba.',
  },
  {
    name: 'American Swing',
    sportType: 'CrossTraining',
    movementPattern: 'bisagra de cadera',
    anatomicalPlane: 'sagital',
    description:
      'Variante del swing donde la pesa rusa termina totalmente vertical sobre la cabeza.' +
      ' Requiere más potencia de cadera y movilidad de hombro.',
    instructions:
      '• Mantén la espalda neutra y no permitas que el peso te encorve al bajar entre las piernas.' +
      ' | • La pesa debe subir por la potencia del glúteo, no por un tirón frontal de los hombros.',
  },
  {
    name: 'Kettlebell Snatch',
    sportType: 'CrossTraining',
    movementPattern: 'bisagra de cadera',
    anatomicalPlane: 'sagital',
    description:
      'Arrancada unilateral con kettlebell. La pesa debe girar alrededor de la mano para no' +
      ' golpear el antebrazo en la recepción arriba.',
    instructions:
      '• "Suaviza" el agarre arriba para permitir que la bola de la pesa se asiente sin impacto.' +
      ' | • Usa un movimiento de cadera potente para lanzar la pesa en una trayectoria vertical.',
  },
  {
    name: 'Toes to Bar',
    sportType: 'CrossTraining',
    movementPattern: 'estabilizacion',
    anatomicalPlane: 'sagital',
    description:
      'Colgado de la barra, llevar las puntas de los pies hasta tocar la barra mediante' +
      ' una flexión explosiva de cadera y core.',
    instructions:
      '• Utiliza el balanceo (kipping) desde los hombros para generar inercia hacia atrás.' +
      ' | • Empuja la barra hacia abajo con los brazos estirados para elevar el torso.',
  },
  {
    name: 'Chest to Bar',
    sportType: 'CrossTraining',
    movementPattern: 'traccion vertical',
    anatomicalPlane: 'frontal',
    description:
      'Dominada explosiva donde el pecho (debajo de la clavícula) debe tocar físicamente la barra.' +
      ' Requiere más potencia que una dominada normal.',
    instructions:
      '• Mantén los codos hacia atrás y las escápulas retraídas en el momento del contacto.' +
      ' | • Utiliza una extensión de cadera potente (kip) para propulsar el pecho hacia la barra.',
  },
  {
    name: 'Double Unders',
    sportType: 'CrossTraining',
    movementPattern: 'flexo/extension de tobillo',
    anatomicalPlane: 'sagital',
    description:
      'Salto a la comba donde la cuerda pasa dos veces bajo los pies en un solo salto.' +
      ' Requiere agilidad y timing.',
    instructions:
      '• Mantén los codos pegados a los costados y realiza el giro de cuerda solo con las muñecas.' +
      ' | • Salta de forma vertical y elástica, evitando doblar las rodillas (salto de "pogo").',
  },
  {
    name: 'Wall Ball Shots',
    sportType: 'CrossTraining',
    movementPattern: 'dominante de rodilla',
    anatomicalPlane: 'sagital',
    description:
      'Lanzamiento del balón medicinal a una diana tras realizar una sentadilla profunda.' +
      ' Combina potencia de piernas y empuje de brazos.',
    instructions:
      '• Mantén el balón a la altura de la cara, no en el pecho, para facilitar el lanzamiento vertical.' +
      ' | • Recepciona el balón con las manos arriba y baja de inmediato a la sentadilla con control.',
  },
  {
    name: 'Sled Push (Trineo)',
    sportType: 'CrossTraining',
    movementPattern: 'locomocion y transporte',
    anatomicalPlane: 'sagital',
    description:
      'Empuje de un trineo lastrado caminando o corriendo.' +
      ' Ejercicio masivo de potencia de piernas y estabilidad de core.',
    instructions:
      '• Mantén los brazos bloqueados y el torso inclinado en una línea recta desde talones a hombros.' +
      ' | • Da pasos potentes apoyando el metatarso y empujando el suelo hacia atrás.',
  },
  {
    name: 'Muscle-up (Barra o Anillas)',
    sportType: 'CrossTraining',
    movementPattern: 'traccion vertical',
    anatomicalPlane: 'sagital',
    description:
      'Ejercicio gimnástico de alta dificultad que combina una dominada explosiva con una transición' +
      ' rápida para terminar en un fondo (dip).',
    instructions:
      '• Inicia con un balanceo (kip) potente para generar inercia ascendente.' +
      ' | • Mantén los hombros activos y el abdomen firme durante toda la transición sobre la barra.',
  },
  {
    name: 'Crol (Estilo libre)',
    sportType: 'Natación',
    movementPattern: 'locomocion y transporte',
    anatomicalPlane: 'transversal',
    description:
      'Nado alterno de brazos con patada de tijera continua. Es el estilo más rápido y eficiente.',
    instructions:
      '• Mantén el codo alto durante la fase de recobro para una entrada de mano limpia.' +
      ' | • Rota el cuerpo sobre su eje longitudinal para facilitar la brazada y la respiración lateral.',
  },
  {
    name: 'Espalda',
    sportType: 'Natación',
    movementPattern: 'locomocion y transporte',
    anatomicalPlane: 'transversal',
    description: 'Nado boca arriba con brazada alterna circular y patada continua.',
    instructions:
      '• Mantén la cadera alta y la mirada hacia el techo para asegurar la flotabilidad del torso.' +
      ' | • El pulgar sale primero del agua y el meñique entra primero para optimizar la tracción.',
  },
  {
    name: 'Braza',
    sportType: 'Natación',
    movementPattern: 'locomocion y transporte',
    anatomicalPlane: 'sagital',
    description:
      'Estilo de nado simultáneo donde los brazos dibujan un círculo frente al pecho y las' +
      ' piernas realizan una patada de rana.',
    instructions:
      '• Coordina el movimiento: brazada, respiración, patada y deslizamiento (fase de extensión).' +
      ' | • Mantén los dedos de los pies hacia afuera durante la fase de empuje de la patada.',
  },
  {
    name: 'Mariposa',
    sportType: 'Natación',
    movementPattern: 'locomocion y transporte',
    anatomicalPlane: 'sagital',
    description:
      'Estilo simultáneo muy potente con brazada circular doble y patada de delfín' +
      ' (ondulación del cuerpo).',
    instructions:
      '• La ondulación debe nacer desde el pecho y fluir hacia la punta de los pies.' +
      ' | • Sincroniza las dos patadas por cada ciclo de brazos: una al entrar y otra al traccionar.',
  },
  {
    name: 'Nado con palas',
    sportType: 'Natación',
    movementPattern: 'locomocion y transporte',
    anatomicalPlane: 'transversal',
    description:
      'Nado de crol o estilo técnico utilizando palas en las manos para aumentar la resistencia' +
      ' al agua y mejorar la fuerza de tracción.',
    instructions:
      '• Asegura que la entrada de la mano sea limpia para evitar el exceso de presión en el hombro.' +
      ' | • Enfócate en sentir el agarre del agua durante toda la fase de empuje bajo el cuerpo.',
  },
  {
    name: 'Nado con aletas',
    sportType: 'Natación',
    movementPattern: 'locomocion y transporte',
    anatomicalPlane: 'sagital',
    description:
      'Nado utilizando aletas cortas o largas para aumentar la propulsión de las piernas,' +
      ' mejorando la flexibilidad del tobillo y la velocidad.',
    instructions:
      '• Mantén la patada naciendo desde la cadera, evitando flexionar excesivamente las rodillas.' +
      ' | • Aprovecha la velocidad extra para trabajar la alineación hidrodinámica del torso.',
  },
  {
    name: 'Nado con pull-buoy',
    sportType: 'Natación',
    movementPattern: 'locomocion y transporte',
    anatomicalPlane: 'transversal',
    description:
      'Nado con un flotador entre las piernas para anular la patada. Obliga a centrar todo el' +
      ' esfuerzo en la técnica y fuerza de los brazos.',
    instructions:
      '• Mantén las piernas juntas y relajadas para evitar que el pull-buoy se desplace.' +
      ' | • Mantén el core firme para evitar que la cadera caiga o se balancee lateralmente.',
  },
  {
    name: 'Patada de crol con tabla',
    sportType: 'Natación',
    movementPattern: 'locomocion y transporte',
    anatomicalPlane: 'sagital',
    description:
      'Ejercicio de aislamiento para las piernas utilizando una tabla para mantener el torso a flote.' +
      ' Mejora la resistencia y potencia del tren inferior.',
    instructions:
      '• Sujeta la tabla por la parte superior o los laterales manteniendo los brazos estirados.' +
      ' | • Mantén la cabeza dentro o fuera del agua buscando siempre una posición horizontal de la cadera.',
  },
  {
    name: 'Patada de mariposa (Delfín)',
    sportType: 'Natación',
    movementPattern: 'locomocion y transporte',
    anatomicalPlane: 'sagital',
    description:
      'Movimiento ondulatorio simultáneo de las piernas. Es la base de la propulsión en el estilo' +
      ' mariposa y en las salidas subacuáticas.',
    instructions:
      '• Inicia la ondulación desde el pecho, permitiendo que el movimiento fluya hasta los pies.' +
      ' | • Mantén los tobillos relajados para maximizar el "latigazo" al final del movimiento.',
  },
  {
    name: 'Viraje de crol (Voltereta)',
    sportType: 'Natación',
    movementPattern: 'rotacion/anti-rotacion',
    anatomicalPlane: 'sagital',
    description:
      'Maniobra de giro sobre el eje transversal para cambiar de sentido al llegar a la pared' +
      ' en natación.',
    instructions:
      '• Inicia el giro llevando la barbilla al pecho justo antes de tocar la pared con las manos.' +
      ' | • Impúlsate con fuerza de la pared con ambos pies buscando una posición de flecha (streamline).',
  },
  {
    name: 'Salida desde bloque',
    sportType: 'Natación',
    movementPattern: 'dominante de rodilla',
    anatomicalPlane: 'sagital',
    description:
      'Salto explosivo desde la plataforma de salida para iniciar la competición con la' +
      ' máxima inercia posible.',
    instructions:
      '• Agarra el borde del bloque con los dedos para generar tensión previa al despegue.' +
      ' | • Salta buscando la máxima extensión de piernas y entra al agua por un "solo agujero".',
  },
];
