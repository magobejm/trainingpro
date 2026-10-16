# TP-43: previsión de asignación de rutinas

## Comportamiento

La web revisa la planificación antes de asignar una rutina diferente. Elegir continuar o reemplazar no escribe datos. El diálogo identifica cliente y rutina, muestra cantidades y permite desplegar fechas y entrenamientos. Las sesiones iniciadas, completadas e incompletas se conservan; otra sesión pendiente del mismo día se puede retirar. Los omitidos sin inicio siguen siendo retirables.

La fecha de corte es el día local del navegador, incluido. La previsión incluye todo el futuro. No crea automáticamente eventos para la rutina nueva.

## Contratos y transacción

- `POST /calendar/clear-future-workouts`, con `dryRun: true`, devuelve `RoutineHandoffPreview`: cliente, fecha de corte, rutina actual, listas `removable` y `preserved`, motivos y firma. La simulación utiliza una transacción de lectura consistente sin ejecutar cierres de sesión ni escrituras.
- Sin `dryRun`, la petición conserva la respuesta `{ archived }` y utiliza la misma selección protegida.
- `PATCH /clients/:clientId` acepta `routineHandoff: { mode, from, expectedSignature }` junto con `trainingPlanId`. Validación, retirada y asignación comparten transacción; un conflicto devuelve `409`, código `ROUTINE_HANDOFF_CHANGED`, sin cambios parciales.
- La confirmación bloquea primero el cliente y después sus sesiones y eventos. Se relee el estado con `READ COMMITTED` tras obtener los bloqueos. El bloqueo del cliente impide inserciones concurrentes mediante las claves foráneas; bloquear filas existentes evita movimientos que entren en el intervalo revisado. No se usa una instantánea antigua para decidir qué archivar.
- Si cambia el calendario, la asignación o el estado de las sesiones, el diálogo recarga la previsión y exige otra confirmación. El guardado independiente de una plantilla no se revierte al cancelar su asignación; un reintento dentro de la revisión reutiliza la plantilla guardada.

## Validación automatizada

- Reglas compartidas: vacío, pasado, hoy, futuro lejano, fechas compartidas, coincidencia por día de rutina, fallback para eventos antiguos sin día, estados iniciados y finalizados.
- PostgreSQL local: equivalencia previsión/resultado, continuar, reemplazar, permisos, cambios de estado/asignación/eventos, inicio concurrente, aparición de una sesión después de la primera lectura y rollback si falla la asignación.
- Web: cancelación, navegación solo tras éxito, envío de la firma, conservación del borrador y reutilización de la plantilla tras un fallo.
- Suites completas de API, web y compartidos; contratos HTTP y OpenAPI; tipos de API, web y móvil; lint de archivos afectados y compilaciones de API y web.

Para repetir las pruebas con base real, proporcionar `TEST_SESSION_DATABASE_URL` a una base local migrada y ejecutar `pnpm --filter @trainerpro/api test:session-transitions`. El comando incluye TP-33 y TP-43 y se ejecuta en CI tras las migraciones. Las fixtures generan y eliminan sus propios registros.

## Recorrido visual local

Comprobado con Playwright, web Vite en `127.0.0.1:5173` y API local en `localhost:8080`, con autenticación real y datos aislados, sin simular respuestas HTTP:

1. Biblioteca: dos entrenamientos retirables (uno en 2030) y tres protegidos, con sus fechas y motivos. Cancelar mantiene asignación y cinco eventos.
2. Inicio de un entrenamiento durante la revisión: primera confirmación recibe conflicto; conserva asignación y eventos y muestra un retirable y cuatro protegidos. Reconfirmar asigna la rutina y archiva solo el evento de 2030.
3. Planificador, «Guardar y asignar», continuar: asigna la rutina guardada y conserva los cinco eventos.
4. Conexión desactivada al cargar la previsión: mensaje de error, confirmación deshabilitada, reintento al reconectar y cancelación sin escrituras.
5. Revisión visual a 1298 × 883 y 390 × 844; fechas localizadas, listas desplegables y controles de confirmación accesibles.

Se retiraron las fixtures visuales y el archivo temporal de autenticación al terminar. El navegador muestra los avisos anteriores de React Native Web sobre sombras y `pointerEvents`; el editor también presenta el aviso anterior de claves de `EmptyIllustration`. Los errores de red y 409 producidos durante los escenarios son esperados.

## Despliegue

Publicar primero la API compatible, completar su despliegue en todas las instancias y después publicar la web. La web comprueba `GET /health` y exige `capabilities.routineHandoffPreview: true` antes de solicitar la simulación; ante una API antigua bloquea la revisión sin enviar el POST, porque las versiones antiguas ignoran `dryRun`. OpenAPI, ejemplos y tipos están actualizados. No hay migración de datos ni módulos nativos nuevos. Las pantallas móviles no cambian.
