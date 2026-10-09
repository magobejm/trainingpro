# TP-26 · Permisos y navegación de avisos nativos

## Qué quedó implementado

- El aviso lleva `recipientUserId` (usuario de la sesión) y `clientId`. Si el aviso no es de la cuenta abierta, la app solo se abre.
- `GET /incidents/:incidentId` lo puede leer el entrenador dueño o el propio cliente. Otra cuenta recibe 404.
- Registrar el token con `enabled: false` lo pasa a la cuenta actual y lo deja inactivo. Así la cuenta anterior deja de recibir avisos en ese teléfono.
- Si Android ya no puede volver a preguntar el permiso, la app no se bloquea: registra el token inactivo y sigue. Un cambio de token se vuelve a registrar. Si la baja al cerrar sesión falla, el token queda pendiente y el siguiente inicio lo reasigna. Esa baja no reintenta la sesión caducada.
- Pulsar un aviso abre la sesión de hoy del cliente, el detalle de la sesión del entrenador, el detalle de la incidencia (marcar revisada y responder) o el chat de ese cliente. El botón atrás de Android cierra la pantalla del entrenador.
- Si el permiso está denegado, los ajustes del entrenador muestran el aviso y el botón "Abrir ajustes".

## Tests

- API: 274 tests en verde, incluidos los datos del aviso, el registro con `enabled: false` y el acceso a la incidencia.
- Móvil: `resolveNotificationTarget` cubre otra cuenta, cada tipo de aviso y datos incompletos. El resto de la suite móvil pasa si `EXPO_PUBLIC_API_BASE_URL` no está definida.
- Web: 36 tests en verde.
- Typecheck del monorepo en verde.

## Prueba en el Pixel

Hecha el 9 de octubre de 2026 con la APK de la red local, la API en `http://192.168.1.136:8080` y las cuentas QA.

- Con el permiso denegado la app sigue en las preferencias y en el chat. Aparece el aviso "Los avisos están desactivados en este teléfono" y "Abrir ajustes" abre los ajustes del sistema.
- Con la app abierta, el aviso de sesión abre el detalle, el de incidencia abre el detalle y el de cliente inactivo abre el chat. El atrás de Android cierra esa pantalla.
- El recordatorio del cliente abre la sesión de hoy. No había una sesión real, así que la pantalla dice que no hay ejercicios.
- Al cerrar sesión del entrenador, su token queda inactivo. Al entrar el cliente, el token del teléfono pasa a ser suyo y queda activo. Un aviso dirigido al entrenador, con el cliente dentro, solo abre la app y no la pantalla del entrenador.
- Con el proceso de la app terminado, pulsar el aviso la abre pero no entra en la sesión. Con la app abierta sí entra.

La APK de producción se genera con `.run/build-apk-prod.ps1` y sustituye el archivo de `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`. El teléfono se queda con la compilación local.
