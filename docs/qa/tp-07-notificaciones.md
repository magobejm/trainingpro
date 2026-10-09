# TP-07 · Entrega de notificaciones

## Qué quedó implementado

- Migración `0027_notification_delivery` aplicada en local con `prisma migrate deploy`.
- Cada aviso se guarda en `notification_delivery` con clave única `(event_id, device_token_id)`. Repetir el job no crea otro envío.
- El coach recibe sesión completada, incidencia grave, inactividad y adherencia baja, solo si la preferencia está activa. El cliente recibe el recordatorio del día.
- Un token que Expo marca como `DeviceNotRegistered` pasa a inactivo. Un error transitorio reintenta a los 1, 5, 15 y 60 minutos y queda en `FAILED` al quinto intento.
- `POST /maintenance/dispatch` crea los eventos de lote y después entrega los pendientes.
- La app móvil registra el token de Expo al iniciar sesión y lo desactiva al cerrar sesión.

## Tests

`pnpm -r --if-present test` en la API: 274 tests, todos verdes, incluidos los de destinatarios, reintentos, token inválido y job repetido. El fallo de un test de móvil sobre la URL de medios venía de `EXPO_PUBLIC_API_BASE_URL` apuntando a la red local; sin esa variable el test pasa. CI no define esa variable.

## Prueba en el dispositivo

Hecha el 9 de octubre de 2026 con la APK local en el Pixel y la web en `http://localhost:5173/`, ambas con el entrenador QA.

- La app pidió permiso de notificaciones y, al aceptarlo, registró el token. Un aviso de prueba llegó al teléfono. Ese botón se quitó después de la comprobación.
- En la web y en el teléfono las cuatro preferencias del coach estaban activadas y el recordatorio al cliente desactivado. Al apagar "Adherencia semanal baja" en el teléfono, la web lo mostró desactivado tras recargar. Se volvió a activar y la web coincidió.
- El job horario no se lanzó: la API local no tiene `CRON_SECRET`. La repetición del job y el token inválido siguen cubiertos por los tests de la API.
- Firebase y la clave FCM V1 ya estaban configurados para `com.trainerpro.mobile`.
