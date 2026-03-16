export type MobilitySeedExercise = {
  name: string;
  bodyPart: string;
  movementPattern: string;
  anatomicalPlane: string;
  description: string;
  instructions: string;
};

export const MOBILITY_EXERCISES: MobilitySeedExercise[] = [
  {
    name: 'TKE (Terminal Knee Extension)',
    bodyPart: 'Rodilla',
    movementPattern: 'dominante de rodilla',
    anatomicalPlane: 'sagital',
    description:
      'Extensión final de la rodilla contra la resistencia de una banda anclada al frente.' +
      ' Busca la activación del vasto medial y la salud del tendón rotuliano.',
    instructions:
      '• Mantén el talón del pie que trabaja siempre en contacto con el suelo.' +
      ' | • Asegura que la cadera permanezca alineada y no rote hacia los lados al extender.',
  },
  {
    name: 'Distracción de tobillo con banda',
    bodyPart: 'Tobillo',
    movementPattern: 'flexo/extension de tobillo',
    anatomicalPlane: 'sagital',
    description:
      'La banda tira del astrágalo hacia atrás mientras realizas una flexión dorsal' +
      ' (adelantar la rodilla). "Desbloquea" la articulación para ganar rango.',
    instructions:
      '• Coloca la banda justo por debajo de los maleolos (huesos del tobillo), no en la espinilla.' +
      ' | • Mantén la planta del pie totalmente plana; no permitas que el arco colapse hacia adentro.',
  },
  {
    name: 'Flexión plantar/dorsal con banda',
    bodyPart: 'Tobillo',
    movementPattern: 'flexo/extension de tobillo',
    anatomicalPlane: 'sagital',
    description:
      'Movimiento resistido de llevar la punta del pie hacia adelante y hacia atrás.' +
      ' Fortalece la musculatura que estabiliza el tobillo.',
    instructions:
      '• Realiza el movimiento de forma lenta para evitar que la banda pierda tensión.' +
      ' | • Mantén la pierna totalmente estirada para aislar la articulación del tobillo.',
  },
  {
    name: 'Inversión/Eversión con banda',
    bodyPart: 'Tobillo',
    movementPattern: 'estabilizacion',
    anatomicalPlane: 'frontal',
    description:
      'Movimiento lateral del pie (hacia adentro y hacia afuera) contra la resistencia de la banda.' +
      ' Crucial para la estabilidad tras esguinces.',
    instructions:
      '• Evita que el movimiento nazca de la rodilla; solo debe pivotar el pie.' +
      ' | • Mantén el torso erguido y el core firme para no compensar con el cuerpo.',
  },
  {
    name: 'Poliquin Step-up',
    bodyPart: 'Rodilla',
    movementPattern: 'dominante de rodilla',
    anatomicalPlane: 'sagital',
    description:
      'Bajada lateral de un escalón tocando el suelo solo con el talón.' +
      ' Enfatiza el vasto medial y la estabilidad de la rótula.',
    instructions:
      '• El talón del pie de apoyo debe permanecer pegado al escalón en todo momento.' +
      ' | • Mantén el torso vertical, evitando inclinarte hacia adelante para equilibrarte.',
  },
  {
    name: 'Petersen Step-up',
    bodyPart: 'Rodilla',
    movementPattern: 'dominante de rodilla',
    anatomicalPlane: 'sagital',
    description:
      'Variante del step-up donde se eleva el talón del pie de apoyo para aumentar' +
      ' la demanda sobre el tendón rotuliano.',
    instructions:
      '• Mantén el peso sobre el metatarso del pie de apoyo de forma controlada.' +
      ' | • Asegura que la rodilla siga la dirección del segundo dedo del pie al bajar.',
  },
  {
    name: 'Spanish Squat (Isométrico)',
    bodyPart: 'Rodilla',
    movementPattern: 'dominante de rodilla',
    anatomicalPlane: 'sagital',
    description:
      'Sentadilla mantenida con una banda gruesa tirando de las rodillas hacia adelante.' +
      ' Reduce el dolor en tendinopatías.',
    instructions:
      '• Empuja las tibias contra la banda con fuerza para mantener el torso muy vertical.' +
      ' | • Mantén la cadera en una posición de "sentado", no permitas que caiga demasiado abajo.',
  },
  {
    name: 'Tibialis Raise',
    bodyPart: 'Tobillo',
    movementPattern: 'flexo/extension de tobillo',
    anatomicalPlane: 'sagital',
    description:
      'Apoyado en la pared, se elevan las puntas de los pies del suelo.' +
      ' Fortalece el músculo tibial anterior para proteger la rodilla.',
    instructions:
      '• Mantén las rodillas totalmente bloqueadas durante toda la elevación.' +
      ' | • Aleja los pies de la pared para aumentar la dificultad, manteniendo la espalda apoyada.',
  },
  {
    name: 'Estiramiento excéntrico de gemelo',
    bodyPart: 'Tobillo',
    movementPattern: 'flexo/extension de tobillo',
    anatomicalPlane: 'sagital',
    description:
      'En el borde de un escalón, bajar el talón muy lentamente por debajo de la línea horizontal.' +
      ' Mejora la elasticidad del tendón de Aquiles.',
    instructions:
      '• Realiza el descenso en al menos 3-5 segundos para maximizar la fase excéntrica.' +
      ' | • Mantén la espalda recta y no te dejes caer bruscamente en el punto más bajo.',
  },
  {
    name: '90/90 Hip Switch',
    bodyPart: 'Cadera',
    movementPattern: 'rotacion/anti-rotacion',
    anatomicalPlane: 'transversal',
    description:
      'Sentado con piernas a 90°, rotar las rodillas de un lado a otro.' +
      ' Mejora la rotación interna y externa de cadera.',
    instructions:
      '• Intenta mantener el pecho erguido y las manos fuera del suelo si tu movilidad lo permite.' +
      ' | • Mantén ambos glúteos lo más cerca posible del suelo durante la transición.',
  },
  {
    name: 'Couch Stretch',
    bodyPart: 'Cadera',
    movementPattern: 'estabilizacion',
    anatomicalPlane: 'sagital',
    description:
      'Pie apoyado en pared y rodilla en suelo, estirando psoas y cuádriceps.' +
      ' El estiramiento más potente para la cadena anterior.',
    instructions:
      '• Contrae el glúteo de la pierna estirada para proteger la zona lumbar y aumentar el estiramiento.' +
      ' | • Evita arquear la espalda; mantén el abdomen activo para que el torso suba recto.',
  },
  {
    name: 'Pigeon Pose',
    bodyPart: 'Cadera',
    movementPattern: 'abduccion de cadera',
    anatomicalPlane: 'transversal',
    description:
      'Pierna delantera flexionada en suelo y trasera estirada.' +
      ' Libera la tensión en el glúteo y rotadores externos.',
    instructions:
      '• Mantén la cadera "cuadrada", mirando hacia el suelo, sin volcar el peso hacia un lado.' +
      ' | • No fuerces la rodilla delantera; el ángulo debe ser cómodo para tu articulación.',
  },
  {
    name: 'Frog Stretch',
    bodyPart: 'Cadera',
    movementPattern: 'abduccion de cadera',
    anatomicalPlane: 'frontal',
    description:
      'En cuadrupedia, abrir rodillas lateralmente y llevar la cadera hacia atrás.' +
      ' Apertura profunda de aductores.',
    instructions:
      '• Mantén los pies alineados con las rodillas (pies hacia afuera) para proteger la articulación.' +
      ' | • No permitas que la espalda lumbar se hunda; mantén una posición neutra de columna.',
  },
  {
    name: "World's Greatest Stretch",
    bodyPart: 'Cadera, Columna',
    movementPattern: 'rotacion/anti-rotacion',
    anatomicalPlane: 'transversal',
    description:
      'Zancada profunda llevando el codo al suelo y luego rotando el brazo hacia el techo.' +
      ' Estiramiento global de cadena anterior y posterior.',
    instructions:
      '• Mantén la pierna trasera totalmente estirada con la rodilla bloqueada.' +
      ' | • Sigue la mano con la mirada durante la rotación para asegurar el movimiento torácico.',
  },
  {
    name: 'Distracción de cadera con banda',
    bodyPart: 'Cadera',
    movementPattern: 'estabilizacion',
    anatomicalPlane: 'sagital',
    description:
      'La banda tira del fémur hacia afuera del acetábulo mientras realizas movimientos de cadera.' +
      ' Gana espacio articular.',
    instructions:
      '• Coloca la banda lo más cerca posible de la ingle para que la tracción sea efectiva.' +
      ' | • Realiza movimientos activos de la cadera (círculos, flex-ext) mientras la banda tracciona.',
  },
  {
    name: 'Cossack Squat asistida',
    bodyPart: 'Cadera',
    movementPattern: 'abduccion de cadera',
    anatomicalPlane: 'frontal',
    description:
      'Sentadilla lateral profunda sujetándose a un soporte.' +
      ' Mejora la movilidad lateral y la flexibilidad de la ingle.',
    instructions:
      '• Mantén el talón de la pierna que se flexiona siempre pegado al suelo.' +
      ' | • Usa el soporte solo para mantener el equilibrio, no para cargar el peso.',
  },
  {
    name: 'Jefferson Curl',
    bodyPart: 'Columna',
    movementPattern: 'bisagra de cadera',
    anatomicalPlane: 'sagital',
    description:
      'Flexión de columna vértebra a vértebra hacia el suelo con peso ligero.' +
      ' Fortalece y estira la cadena posterior.',
    instructions:
      '• Baja de forma extremadamente lenta, sintiendo cómo se dobla cada vértebra una a una.' +
      ' | • El peso debe ser mínimo; la clave es la sensación, no la carga.',
  },
  {
    name: 'Cat-Cow (Gato-Camello)',
    bodyPart: 'Columna',
    movementPattern: 'estabilizacion',
    anatomicalPlane: 'sagital',
    description:
      'Movimiento rítmico de arquear y redondear la espalda en cuadrupedia.' +
      ' Mejora la lubricación de los discos intervertebrales.',
    instructions:
      '• Coordina el movimiento con la respiración: inhala al arquear y exhala al redondear.' +
      ' | • Mueve la columna de forma segmentada, desde el cuello hasta el sacro.',
  },
  {
    name: 'Thread the Needle',
    bodyPart: 'Columna',
    movementPattern: 'rotacion/anti-rotacion',
    anatomicalPlane: 'transversal',
    description:
      'Pasar un brazo por debajo del cuerpo en cuadrupedia, buscando apoyar el hombro.' +
      ' Rotación de la espalda media.',
    instructions:
      '• Mantén la cadera estable y centrada; no permitas que se desplace hacia los lados.' +
      ' | • Busca el máximo rango de rotación empujando el hombro activamente hacia el suelo.',
  },
  {
    name: "Child's Pose",
    bodyPart: 'Columna',
    movementPattern: 'estabilizacion',
    anatomicalPlane: 'sagital',
    description:
      'Sentado sobre talones con el torso hacia adelante en el suelo.' +
      ' Descomprime la zona lumbar y relaja la espalda.',
    instructions:
      '• Abre las rodillas para permitir que el torso baje más y la respiración sea fluida.' +
      ' | • Camina con los dedos hacia adelante para estirar también los dorsales y hombros.',
  },
  {
    name: 'Scorpion Stretch',
    bodyPart: 'Columna, Cadera',
    movementPattern: 'rotacion/anti-rotacion',
    anatomicalPlane: 'transversal',
    description:
      'Boca abajo, llevar un pie hacia la mano opuesta rotando la cadera.' +
      ' Estira la cadena anterior y mejora la rotación lumbar.',
    instructions:
      '• Mantén ambos hombros pegados al suelo mientras realizas la rotación de la pierna.' +
      ' | • Realiza el giro de forma lenta y controlada, evitando impulsos o rebotes.',
  },
  {
    name: 'Cobra Stretch',
    bodyPart: 'Columna',
    movementPattern: 'estabilizacion',
    anatomicalPlane: 'sagital',
    description:
      'Tumbado boca abajo, extender los brazos para elevar el pecho.' +
      ' Estira la pared abdominal y mejora la extensión lumbar.',
    instructions:
      '• Mantén los hombros lejos de las orejas (deprimidos) para no cargar el trapecio.' +
      ' | • Si sientes pinzamiento lumbar, apóyate sobre los antebrazos en lugar de las manos.',
  },
  {
    name: 'Extensión torácica (Rodillo)',
    bodyPart: 'Columna',
    movementPattern: 'estabilizacion',
    anatomicalPlane: 'sagital',
    description:
      'Extender la espalda media sobre el rodillo de espuma.' +
      ' Corrige la postura encorvada y mejora la movilidad de hombros.',
    instructions:
      '• Mantén la cadera en el suelo y no permitas que la zona lumbar se arquee excesivamente.' +
      ' | • Sujeta la cabeza con las manos para evitar tensión innecesaria en el cuello.',
  },
  {
    name: 'Masaje miofascial (Rodillo)',
    bodyPart: 'Columna',
    movementPattern: 'estabilizacion',
    anatomicalPlane: 'sagital',
    description: 'Deslizamiento rítmico sobre el rodillo para liberar puntos de gatillo en la espalda.',
    instructions:
      '• Controla la presión mediante el apoyo de tus pies y brazos en el suelo.' +
      ' | • Respira de forma calmada para permitir que la musculatura se relaje sobre el rodillo.',
  },
  {
    name: 'Dislocaciones de hombro',
    bodyPart: 'Hombro',
    movementPattern: 'abduccion de hombro',
    anatomicalPlane: 'frontal',
    description:
      'Pasar un palo o banda desde la cadera frontal hasta la zona lumbar trasera con brazos estirados.',
    instructions:
      '• Mantén los codos totalmente bloqueados; si se doblan, abre más el agarre en el palo.' +
      ' | • Mantén el abdomen apretado para que las costillas no se "abran" al pasar el palo atrás.',
  },
  {
    name: 'Band Pull-aparts',
    bodyPart: 'Hombro',
    movementPattern: 'traccion horizontal',
    anatomicalPlane: 'transversal',
    description:
      'Separar la banda frente al pecho hasta tocar el esternón.' +
      ' Activa los músculos que mantienen los hombros atrás.',
    instructions:
      '• Inicia el movimiento juntando las escápulas, no tirando solo con los brazos.' +
      ' | • Mantén los hombros bajos, evitando que suban hacia las orejas durante la apertura.',
  },
  {
    name: 'Facepull (Movilidad)',
    bodyPart: 'Hombro',
    movementPattern: 'traccion horizontal',
    anatomicalPlane: 'transversal',
    description:
      'Tirar de la banda hacia la cara separando las manos.' +
      ' Enfocado en la rotación externa y salud del manguito rotador.',
    instructions:
      '• Lleva los pulgares hacia atrás al final del movimiento para asegurar la rotación externa.' +
      ' | • Mantén los codos altos, a la misma altura que los hombros.',
  },
  {
    name: '"No Money" drill',
    bodyPart: 'Hombro',
    movementPattern: 'rotacion/anti-rotacion',
    anatomicalPlane: 'transversal',
    description:
      'Con codos pegados al cuerpo, abrir las manos hacia afuera estirando la banda.' +
      ' Fortalece los rotadores externos.',
    instructions:
      '• Mantén los codos "cosidos" a tus costados en todo momento; no permitas que se separen.' +
      ' | • Saca pecho y mantén las escápulas retraídas durante toda la serie.',
  },
  {
    name: 'Wall Slides',
    bodyPart: 'Hombro',
    movementPattern: 'abduccion de hombro',
    anatomicalPlane: 'frontal',
    description:
      'Deslizar los brazos por la pared manteniendo contacto con muñecas y codos.' +
      ' Excelente para la postura.',
    instructions:
      '• Intenta que toda la espalda y la zona lumbar estén en contacto con la pared.' +
      ' | • No fuerces el rango; sube solo hasta donde puedas mantener el contacto de los codos.',
  },
  {
    name: 'Scapular Push-ups',
    bodyPart: 'Hombro',
    movementPattern: 'estabilizacion',
    anatomicalPlane: 'sagital',
    description:
      'En posición de plancha, juntar y separar las escápulas sin doblar los codos.' +
      ' Mejora el control del serrato.',
    instructions:
      '• Los brazos deben permanecer totalmente rectos; el movimiento es solo de la espalda media.' +
      ' | • No permitas que la cabeza caiga hacia el suelo al juntar las escápulas.',
  },
  {
    name: 'Sleeper Stretch',
    bodyPart: 'Hombro',
    movementPattern: 'rotacion/anti-rotacion',
    anatomicalPlane: 'transversal',
    description:
      'Tumbado de lado, presionar el antebrazo hacia el suelo para estirar los rotadores internos.',
    instructions:
      '• Realiza la presión de forma muy suave; es una articulación sensible.' +
      ' | • Mantén el hombro de apoyo directamente debajo del cuerpo para estabilizar la posición.',
  },
  {
    name: 'Círculos cervicales (CARs)',
    bodyPart: 'Cuello',
    movementPattern: 'rotacion/anti-rotacion',
    anatomicalPlane: 'transversal',
    description:
      'Círculos lentos y controlados con el cuello buscando el máximo rango sin dolor.',
    instructions:
      '• Mantén el resto del cuerpo inmóvil; solo debe moverse la articulación del cuello.' +
      ' | • Evita movimientos rápidos; la clave es el control en los puntos de mayor tensión.',
  },
  {
    name: 'Estiramientos de antebrazo',
    bodyPart: 'Muñeca',
    movementPattern: 'estabilizacion',
    anatomicalPlane: 'sagital',
    description:
      'En cuadrupedia, apoyar palmas con dedos mirando hacia las rodillas e inclinarse atrás.',
    instructions:
      '• Mantén las palmas totalmente apoyadas en el suelo; no permitas que se levanten.' +
      ' | • Realiza el estiramiento de forma progresiva y sin rebotes.',
  },
  {
    name: 'Wrist Circles',
    bodyPart: 'Muñeca',
    movementPattern: 'estabilizacion',
    anatomicalPlane: 'transversal',
    description:
      'Círculos amplios con las muñecas manteniendo las manos cerradas o abiertas.',
    instructions:
      '• Busca el máximo rango de movimiento en cada dirección del círculo.' +
      ' | • Mantén los antebrazos relajados para que el movimiento sea fluido en la muñeca.',
  },
  {
    name: 'Pronación/Supinación',
    bodyPart: 'Codo',
    movementPattern: 'rotacion/anti-rotacion',
    anatomicalPlane: 'transversal',
    description:
      'Girar la palma de la mano hacia arriba y hacia abajo manteniendo el codo pegado al cuerpo.',
    instructions:
      '• El movimiento debe ser una rotación pura del antebrazo, sin mover el hombro.' +
      ' | • Mantén el codo flexionado a 90 grados para aislar el movimiento correctamente.',
  },
];
