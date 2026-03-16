export type IsometricExerciseSeed = {
  id: string;
  name: string;
  isometricTypeCode: string;
  equipmentCode: string;
  description: string | null;
  coachInstructions: string | null;
  youtubeUrl: string;
};

export const ISOMETRIC_EXERCISES_V1: IsometricExerciseSeed[] = [
  {
    id: "3aa2ff19-1816-47a6-8398-a8714532835e",
    name: "Wall Sit (Sentadilla en pared)",
    isometricTypeCode: "total",
    equipmentCode: "wall",
    description: "Mantener una posición de sentadilla a 90° con la espalda apoyada en la pared. La carga es el peso corporal mantenido por la contracción constante de los cuádriceps hasta llegar al fallo muscular o tiempo objetivo.",
    coachInstructions: "• Mantén los muslos perfectamente paralelos al suelo y las rodillas sobre los talones.\n\n• Presiona toda la espalda contra la pared, evitando huecos en la zona lumbar.\n\n• No apoyes las manos en las piernas; déjalas a los lados o frente al pecho.\n\n• Avanzado: Realiza una presión de los pies hacia afuera para involucrar el glúteo medio.\n\n• Avanzado: Mantén una respiración diafragmática profunda para prolongar el tiempo bajo tensión.",
    youtubeUrl: "https://youtube.com/shorts/ArzbfYT5MOw?feature=share",
  },
  {
    id: "3a1977ad-76f2-4796-98af-8267c1e566f1",
    name: "Isometric Mid-Thigh Pull (IMTP)",
    isometricTypeCode: "maxima",
    equipmentCode: "fixed_bar",
    description: "Traccionar hacia arriba con la máxima fuerza posible una barra que está anclada a una altura fija (muslo medio). Es una prueba de fuerza absoluta donde no hay desplazamiento, solo generación de tensión máxima contra la barra.",
    coachInstructions: "• Posición de pies a la anchura de las caderas con la barra en contacto con los muslos.\n\n• Genera la máxima tensión posible desde el primer segundo sin dar tirones bruscos.\n\n• Mantén la espalda neutra y los brazos totalmente estirados durante el empuje.\n\n• Avanzado: Enfócate en empujar el suelo con las piernas más que en tirar con los brazos.\n\n• Avanzado: Realiza una apnea (Valsalva) durante los 3-5 segundos de esfuerzo máximo.",
    youtubeUrl: "https://youtube.com/shorts/ArzbfYT5MOw?feature=share",
  },
  {
    id: "6093c664-464b-4fa9-b986-bfbda43883be",
    name: "Overcoming ISO Bench Press",
    isometricTypeCode: "maxima",
    equipmentCode: "barbell",
    description: "Empujar la barra con el 100% de fuerza contra los topes de seguridad del rack en un punto concreto del recorrido (generalmente el punto crítico). No hay movimiento de la barra, solo presión máxima.",
    coachInstructions: "• Ajusta los seguros del rack a la altura deseada (pecho o mitad del recorrido).\n\n• Asegura que los pies estén bien anclados al suelo para transferir la fuerza.\n\n• Aplica la fuerza de forma progresiva hasta llegar al 100% y mantenla 5 segundos.\n\n• Avanzado: Mantén las escápulas retraídas contra el banco incluso bajo presión máxima.\n\n• Avanzado: Exhala el aire con los dientes cerrados para mantener la presión intraabdominal.",
    youtubeUrl: "https://youtube.com/shorts/ArzbfYT5MOw?feature=share",
  },
  {
    id: "c8d2af3a-09bf-434a-a2a9-2a09193aed44",
    name: "Hold de Sentadilla profunda",
    isometricTypeCode: "total",
    equipmentCode: "undefined",
    description: "Mantener la posición más baja de una sentadilla (justo por encima del paralelo) sin apoyo externo. El cuádriceps y el glúteo trabajan para sostener el cuerpo contra la gravedad en el punto de mayor desventaja mecánica.",
    coachInstructions: "• Mantén el torso erguido y los talones firmemente apoyados en el suelo.\n\n• No permitas que las rodillas colapsen hacia adentro; empújalas hacia afuera.\n\n• Mantén el abdomen activo para que la espalda lumbar no se redondee excesivamente.\n\n• Avanzado: Sujeta una mancuerna ligera frente al pecho para desplazar el centro de masas.\n\n• Avanzado: Intenta \"separar el suelo\" con los pies para aumentar la activación lateral.",
    youtubeUrl: "https://youtube.com/shorts/ArzbfYT5MOw?feature=share",
  },
  {
    id: "8fe9b229-db23-46bf-b42f-761a4681aef1",
    name: "ISO Pull-up Hold (Barbilla sobre barra)",
    isometricTypeCode: "total",
    equipmentCode: "barbell",
    description: "Mantenerse colgado de la barra con la barbilla por encima de ella. Requiere una contracción isométrica máxima de dorsales, bíceps y flexores de dedos hasta el agotamiento del agarre o del músculo.",
    coachInstructions: "• Mantén los hombros deprimidos y lejos de las orejas durante todo el sostenido.\n\n• Cruza los pies o mantenlos rectos, pero evita el balanceo del cuerpo.\n\n• Aprieta la barra con toda la palma de la mano para maximizar la fuerza de agarre.\n\n• Avanzado: Intenta separar los codos hacia afuera para enfatizar el dorsal ancho.\n\n• Avanzado: Mantén las piernas estiradas al frente (L-sit) para añadir dificultad abdominal.",
    youtubeUrl: "https://youtube.com/shorts/ArzbfYT5MOw?feature=share",
  },
  {
    id: "bb7d2913-b1ee-4dc2-9a9a-6a85e62fba67",
    name: "Glute Bridge Isometric Hold",
    isometricTypeCode: "total",
    equipmentCode: "undefined",
    description: "Mantener la cadera elevada en posición de puente. Se enfoca en la resistencia del glúteo mayor y la estabilidad pélvica, manteniendo la tensión hasta que la cadera empiece a descender por fatiga.",
    coachInstructions: "• Aprieta los glúteos al máximo y mantén la pelvis en retroversión arriba.\n\n• Los pies deben estar situados de forma que las tibias queden verticales.\n\n• Evita arquear la zona lumbar para ganar altura; la fuerza nace del glúteo.\n\n• Avanzado: Realiza el hold a una sola pierna para duplicar la carga y el reto de equilibrio.\n\n• Avanzado: Coloca una banda sobre las rodillas y empuja hacia afuera durante el hold.",
    youtubeUrl: "https://youtube.com/shorts/ArzbfYT5MOw?feature=share",
  },
  {
    id: "e478e95f-331d-4345-8b72-7dc8998da215",
    name: "Calf Raise ISO Hold (Puntillas)",
    isometricTypeCode: "total",
    equipmentCode: "undefined",
    description: "Mantenerse de puntillas en el punto de máxima contracción del gemelo. El objetivo es fortalecer el tendón de Aquiles y la resistencia de las fibras del gastrocnemio y sóleo ante la fatiga.",
    coachInstructions: "• Sube hasta quedar sobre la base de los dedos y bloquea la posición arriba.\n\n• Mantén las rodillas totalmente estiradas para enfatizar el gemelo.\n\n• Utiliza una pared solo para equilibrio ligero, no para descargar peso.\n\n• Avanzado: Realiza el hold en el borde de un escalón para aumentar la demanda de estabilidad.\n\n• Avanzado: Mantén la posición a una sola pierna para una carga total del peso corporal.",
    youtubeUrl: "https://youtube.com/shorts/ArzbfYT5MOw?feature=share",
  },
  {
    id: "91ddad70-7b61-4442-8b73-68c1a9f11a9f",
    name: "Lateral Raise ISO Hold",
    isometricTypeCode: "total",
    equipmentCode: "dumbbell",
    description: "Mantener las mancuernas elevadas lateralmente a la altura de los hombros (brazos en cruz). La carga genera un brazo de palanca largo que fatiga rápidamente el deltoides lateral.",
    coachInstructions: "• Mantén una ligera flexión en los codos para proteger la articulación.\n\n• No permitas que las manos suban por encima de la altura de tus hombros.\n\n• Mantén el cuello relajado; no encojas los hombros hacia las orejas.\n\n• Avanzado: Gira ligeramente las mancuernas (pulgar hacia arriba) para variar el estímulo.\n\n• Avanzado: Mantén el core firme para evitar que el cuerpo se balancee hacia atrás.",
    youtubeUrl: "https://youtube.com/shorts/ArzbfYT5MOw?feature=share",
  },
  {
    id: "4e54b506-fce6-4eee-9cee-b2db34a7d5ca",
    name: "ISO Press contra pines (Vertical)",
    isometricTypeCode: "maxima",
    equipmentCode: "barbell",
    description: "Empujar la barra hacia arriba contra los topes de seguridad del rack situados sobre la cabeza. Se aplica el 100% de fuerza para intentar \"atravesar\" los seguros, trabajando la potencia de hombros y tríceps.",
    coachInstructions: "• Colócate en posición de press militar con la barra bloqueada por los seguros.\n\n• Empuja con explosividad y mantén la presión máxima durante 3 a 5 segundos.\n\n• Mantén los glúteos y el abdomen muy apretados para estabilizar la columna.\n\n• Avanzado: Realiza el empuje en diferentes ángulos (frente a la cara o sobre la cabeza).\n\n• Avanzado: Involucra el empuje de las piernas (leg drive) para transferir más fuerza.",
    youtubeUrl: "https://youtube.com/shorts/ArzbfYT5MOw?feature=share",
  },
];
