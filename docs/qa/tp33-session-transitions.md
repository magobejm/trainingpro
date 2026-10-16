# TP-33 · Transiciones atómicas de sesión

## Comportamiento

- Empezar, cerrar y guardar cualquiera de los siete tipos de actividad adquiere el mismo bloqueo de fila sobre session_instance dentro de una transacción. Toda lectura y escritura posterior usa el cliente de esa transacción, sin pedir una segunda conexión al pool.
- El cierre por seis horas de inactividad selecciona candidatos y, para cada uno, bloquea y vuelve a leer estado, ámbito y última actividad. No cierra por la actividad observada antes de esperar al bloqueo. Mantiene finishedAt en el último registro o el inicio si no hay registros.
- Marcar como omitida exige, en la escritura y bajo bloqueo, que siga pendiente, sin inicio, sin archivar, del cliente autorizado y sin actividad registrada. Si otra operación ganó devuelve 409.
- Deshacer la omisión utiliza una escritura condicional sobre el estado pendiente y el propietario; iniciar limpia la omisión.
- Guardar actividad o cerrar explícitamente una sesión marcada como omitida devuelve 400: primero debe iniciarse o deshacerse la omisión. Los registros en sesiones cerradas siguen rechazándose.
- Reutilizar una sesión existente al asegurar el entrenamiento también bloquea y relee antes de decidir si puede reemplazar sus ejercicios.

No hay migración ni cambios en las respuestas o parámetros HTTP. Las transacciones usan READ COMMITTED para releer datos confirmados después de esperar al bloqueo. Referencia: [transacciones de Prisma 6](https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions).

## Pruebas

Las regresiones unitarias cubren estado pendiente obsoleto al omitir/deshacer y actividad nueva en fuerza, cardio, pliometría, movilidad, isométricos y deportes.

La suite session-transitions.postgres.spec.ts crea una organización y un cliente aislados, utiliza varias conexiones reales y elimina sus registros al finalizar. Incluye:

1. Dos inicios concurrentes conservan el mismo instante de inicio.
2. Inicio confirmado mientras omitir/deshacer espera con una lectura anterior.
3. Una serie y un intervalo en curso conservan abierta la sesión ante el cierre automático.
4. Una primera serie pendiente impide omitir; una omisión previa impide guardar series.
5. El cierre ganador impide registrar actividad o reabrir la sesión.
6. El cierre explícito espera a una serie en curso y rechaza las posteriores.

Ejecución: configurar TEST_SESSION_DATABASE_URL con una base local de pruebas migrada y ejecutar pnpm --filter @trainerpro/api test:session-transitions. La suite rechaza hosts ajenos a localhost y se omite cuando no se proporciona esa variable. CI la ejecuta contra su servicio PostgreSQL después de las migraciones.

## Validación ejecutada · 16/10/2026

- Suite completa de API: 118 suites y 447 pruebas correctas, incluidas 10 pruebas con PostgreSQL real; contratos HTTP incluidos.
- TypeScript, lint de los archivos afectados, formato y compilación de API correctos.
- API local reiniciada con el cambio compilado; /health devuelve 200.

## Recorrido real desde las interfaces · 16/10/2026

Se utiliza la app Expo Web a 390 × 844 y la web del coach, con la API y Supabase locales y sin respuestas simuladas. Cliente: QA Móvil Local 20261016.

- Desde móvil: No lo hago con motivo → Lo haré → empezar → guardar tres series de 8 repeticiones, 40 kg y RPE 7 → terminar día con RPE 7. La API conserva las tres series y devuelve COMPLETED, isIncomplete=false; la web muestra Entrenamiento hecho.
- Desde una segunda vista móvil se confirma una omisión basada en un calendario anterior, después de iniciar la sesión en otra petición: la API responde 409 y la sesión conserva IN_PROGRESS sin marca de omisión.
- La prueba detectó que el móvil no explicaba ese 409. Ahora muestra un aviso localizado, actualiza el calendario, deshabilita confirmar tras el conflicto y permite cancelar. Las claves de las filas dependen del día y del entrenamiento para conservar el aviso si el refresco reordena la lista. Se comprobó también con dos entrenamientos del mismo día.
- Para la inactividad se preparó otra sesión QA con inicio hace ocho horas. Una serie con fecha reciente impide el cierre al consultar desde la web. Tras envejecer únicamente esa serie QA a siete horas, la consulta web provoca el cierre incompleto y fija finishedAt en su último registro. Estas fechas se ajustan directamente en la base local para evitar esperar seis horas.
- La web muestra Incompleto; el móvil muestra Entreno incompleto, permite Ver sesión y bloquea los campos y las acciones de guardado.
- Regresión móvil tras los ajustes: 222 pruebas en 52 suites, tipos y lint correctos.

Esta validación móvil se ha realizado en React Native Web. No se ha ejecutado en un dispositivo Android o iOS. Las capturas de consola de conflictos contienen el 409 esperado; persiste además un aviso React preexistente de claves en EmptyIllustration en la web.

- Detalle web de la sesión del 16/10: comprobados tres registros de 8 repeticiones, 40 kg y RPE 7, iguales a los guardados desde móvil. Consultado también el detalle de la sesión incompleta del 15/10.
- Exportaciones Metro/Hermes finales para Android, iOS y web correctas (la compilación no sustituye la ejecución nativa).
