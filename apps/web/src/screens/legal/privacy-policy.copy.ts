export const PRIVACY_TITLE = 'Política de privacidad';
export const PRIVACY_UPDATED = '11 de noviembre de 2026';
export const PRIVACY_LOGO_SRC = '/logo.png';
export const PRIVACY_LOGO_LABEL = 'FitCoach';

export const PRIVACY_SECTIONS: Array<{ title: string; paragraphs: string[] }> = [
  {
    title: 'Responsable',
    paragraphs: [
      'José Manuel González Benito es el responsable del tratamiento de Trainer Pro.',
      'Puedes escribirle a jose_manuel_gonzalez_benito@hotmail.com.',
    ],
  },
  {
    title: 'Qué es Trainer Pro',
    paragraphs: [
      'Trainer Pro es una aplicación para que un entrenador planifique el entrenamiento de sus deportistas y siga su evolución. El entrenador usa la web y el deportista usa la aplicación móvil.',
    ],
  },
  {
    title: 'Datos que tratamos',
    paragraphs: [
      'De la cuenta guardamos el nombre, los apellidos, el correo y el rol.',
      'Del entrenamiento guardamos rutinas, sesiones, ejercicios, comentarios y el esfuerzo percibido.',
      'Del bienestar guardamos el sueño, la motivación, la recuperación y las notas que la persona escribe.',
      'Si se registran, guardamos medidas corporales como el peso.',
      'Si el deportista lo autoriza en el teléfono, leemos de Health Connect o HealthKit los pasos, el sueño, el peso, la frecuencia cardíaca y las calorías activas.',
      'Si el deportista conecta Garmin, recibimos sus actividades, el sueño, la frecuencia cardíaca en reposo y la variabilidad de la frecuencia cardíaca. El entrenador puede enviar al reloj un entrenamiento de cardio ya planificado. Los tokens de acceso se guardan cifrados.',
      'De la nutrición guardamos el plan. Si se pide una estimación, se envía la foto de una comida o de una etiqueta. Si se consulta un código de barras, se envía solo ese código.',
    ],
  },
  {
    title: 'Para qué los usamos',
    paragraphs: [
      'Los usamos para prestar el servicio de entrenamiento y para mostrar al entrenador asignado la evolución de su deportista.',
      'Los datos de Garmin y del teléfono solo se incorporan si el deportista conecta esa fuente. No vendemos los datos ni los usamos para publicidad.',
    ],
  },
  {
    title: 'Base del tratamiento',
    paragraphs: [
      'El servicio se presta porque el entrenador y el deportista lo utilizan.',
      'La conexión con Garmin y los permisos de salud del teléfono dependen del consentimiento. Se retira desconectando Garmin en la aplicación o revocando el permiso en el teléfono.',
    ],
  },
  {
    title: 'Quién puede verlos',
    paragraphs: [
      'Los ve el deportista y el entrenador que tiene asignado.',
      'José Manuel González Benito accede a los datos solo para operar el servicio.',
    ],
  },
  {
    title: 'Quién los trata por nuestra cuenta',
    paragraphs: [
      'Google Cloud aloja la API, la base de datos y la web.',
      'Supabase gestiona el inicio de sesión.',
      'Garmin es el origen de los datos del reloj cuando el deportista conecta su cuenta.',
      'Google Gemini recibe la foto de una comida o de una etiqueta solo cuando se pide una estimación nutricional. No recibe datos de Garmin ni del reloj.',
      'Open Food Facts recibe el código de barras cuando se consulta un producto.',
    ],
  },
  {
    title: 'Durante cuánto tiempo',
    paragraphs: [
      'Los datos se conservan mientras la cuenta existe. Al eliminarla se borran, salvo que una obligación legal exija conservarlos.',
    ],
  },
  {
    title: 'Tus derechos',
    paragraphs: [
      'Puedes pedir acceso, rectificación, supresión, limitación, portabilidad y oposición escribiendo a jose_manuel_gonzalez_benito@hotmail.com.',
      'También puedes reclamar ante la Agencia Española de Protección de Datos, en aepd.es.',
    ],
  },
  {
    title: 'Menores',
    paragraphs: ['Trainer Pro no está dirigido a menores de 14 años.'],
  },
];
