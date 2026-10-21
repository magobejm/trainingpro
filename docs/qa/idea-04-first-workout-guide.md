# IDEA-04 · Primer entrenamiento guiado

Validación: 21 de octubre de 2026. Desarrollo en `develop`.

## Implementación

- Preferencia versionada por cliente, migración aditiva y GET/PATCH de la cuenta autenticada. Elegibilidad basada en todo el historial; avance monotónico y estados terminales protegidos mediante bloqueo de fila.
- Tarjetas en la sesión y el modal de ejercicio. Un guardado vacío o fallido no avanza; un guardado real sincronizado o pendiente sí. Completar la guía no cierra la sesión.
- Ayuda accesible desde Más, repetición local, pausa persistente y almacenamiento seguro separado por cuenta y entorno. Reconciliación al volver a primer plano y con conexión.
- Chat modal con borrador contextual sin envío automático. Conserva montada la pantalla del ejercicio.
- Traducciones ES/EN y contratos OpenAPI. Corrección de la detección de registros parciales que contienen únicamente RIR 0.
- Puertos conservados: web 5173, Expo Web 19006, API 8080.

## Comprobaciones automáticas

- Shared: 86 pruebas superadas.
- API: 488 superadas, 33 omitidas por sus condiciones de integración; contratos: 15 superadas.
- Web: 347 superadas.
- Móvil: 265 superadas en 58 suites.
- Lint y comprobaciones de tipos del workspace superados.
- Revisión independiente del código: detectó una respuesta GET antigua que podía retroceder el progreso; corregida con prueba de regresión.

## Recorrido real en Pixel 10 Pro, Android 17

APK local con OTA desactivadas, API 8080 y Supabase locales mediante USB. Cuenta y rutina de pruebas locales con seis tipos de ejercicio. Evidencias locales en `output/qa-idea04/`, sin credenciales en este informe.

1. Invitación automática → Empezar guía → ejercicio → explicación de objetivos y realizado → guardar.
2. Guardar sin datos mantiene el paso de guardar y no crea un registro.
3. Desconectar el reenvío USB de API después de cargar la sesión. Introducir únicamente RIR 0 y guardar: un registro pendiente real y paso de sincronización.
4. Pasar a segundo plano y volver: registro y avance conservados. Reconectar: un único registro en servidor, RIR 0, repeticiones y peso ausentes. Sin valores prescritos imputados.
5. Escribir peso 17.5 sin guardarlo. Abrir comentarios y volver; abrir chat con borrador y volver mediante Atrás. El campo conserva 17.5 y el ejercicio sigue abierto. No se pulsa Enviar.
6. Completar guía: preferencia `completed/help`, elegibilidad automática falsa y sesión todavía `IN_PROGRESS`. Guardar después el peso por el botón existente.
7. Abrir fuerza, cardio, pliometría, movilidad, isométrico y deporte. Guardar datos parciales en los seis y contrastar la respuesta de API. Cardio 1,250 km → 1250 m; deporte 2,5 min → 150 s y 2,5 km → 2500 m; isométrico 30 → 30 s.
8. Más → Ayuda → Guiarme en mi próxima sesión → reabrir sesión: repetición disponible, sin reiniciar el estado completado de la cuenta.
9. Pausar, cerrar el proceso y reabrir: pausa y registros conservados; continuar disponible.
10. Texto del sistema al 130 %, arranque en frío: contenido y botones de la tarjeta de guía se redistribuyen y permanecen legibles. Restaurar escala original 100 %.

Las pruebas de errores, conflicto, omisión, sesiones de solo lectura, aislamiento por cuenta/entorno y reconciliación de estados entre dispositivos tienen cobertura automatizada. No se ha utilizado un segundo dispositivo físico.

## Artefactos y publicación

APK de producción separada: versión 1.3.1, código 2, runtime propio para evitar recibir OTA de 1.3.0. HTTP local desactivado y OTA habilitadas. Verificar los endpoints dentro del bundle empaquetado, además del manifiesto; al alternar entornos se debe limpiar la caché de Metro.

Publicar primero migración/API mediante el flujo de `main`, comprobar CI y despliegue y después instalar con actualización conservando datos y firma. Cerrar la cuenta local de pruebas antes del cambio de entorno. La comprobación en producción se limita a arranque, conexión y Ayuda, sin crear entrenamientos ni enviar mensajes reales.
