# TP-22 · APK nativa en Android

Fecha: 2026-10-09

| Dato              | Valor                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| App               | Trainer Pro Mobile `1.2.0` (versionCode `1`)                                                                                               |
| Commit de partida | `96444ad`                                                                                                                                  |
| Paquete           | `com.trainerpro.mobile`                                                                                                                    |
| Build             | `assembleRelease` local, perfil equivalente a EAS `preview` (APK). `TRAINERPRO_LAN_BUILD=1`: HTTP permitido y actualizaciones OTA apagadas |
| Dispositivo       | Google Pixel 10 Pro, Android 17, serie `58021FDCH0070X`                                                                                    |
| API               | `http://192.168.1.136:8080`                                                                                                                |
| Supabase          | `http://192.168.1.136:55421`                                                                                                               |

La APK anterior (`1.0.0`, instalada el 2026-05-12) tenía otra firma. Hubo que desinstalarla. Play Protect pregunta al instalar; se eligió «No enviar».

El móvil está en `192.168.68.105/22` y el PC en `192.168.1.136`. El ping no pasa, pero el teléfono sí abre la API y el auth de Supabase por TCP. El firewall de Windows admite la entrada a los puertos 8080 y 55421 en los perfiles público y privado.

## Recorrido

| Punto                                                               | Resultado                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instalación y arranque                                              | Correcto. Abre el login de FitCoach. Logcat sin errores fatales de JS.                                                                                                                                                                                                                                                                                                    |
| Teclado en el login                                                 | Correcto. Al pulsar la contraseña, el campo y «Entrar» quedan por encima del teclado.                                                                                                                                                                                                                                                                                     |
| Atrás en el login                                                   | Correcto. El botón atrás vuelve al lanzador.                                                                                                                                                                                                                                                                                                                              |
| Atrás dentro de la app                                              | Corregido en esta pasada e instalado en la APK. Antes no había manejo del botón atrás: un overlay o una pestaña que no fuera Inicio cerraban la app. Ahora cierra el overlay (sesión, día, calendario, tests) o vuelve a Inicio, y solo sale desde Inicio. Los modales ya cerraban solos. No se pudo pulsar atrás dentro de una sesión porque falta entrar con la cuenta. |
| Segundo plano en el login                                           | Correcto. Tras ir a Inicio del sistema y volver, sigue el login.                                                                                                                                                                                                                                                                                                          |
| Login con Cliente Cinco                                             | Pendiente. La contraseña no está en el repositorio (el seed la deja en el gestor del equipo).                                                                                                                                                                                                                                                                             |
| Sesión de entrenamiento                                             | Pendiente, hace falta esa sesión iniciada.                                                                                                                                                                                                                                                                                                                                |
| Vídeos (YouTube y subido)                                           | Pendiente, mismo motivo.                                                                                                                                                                                                                                                                                                                                                  |
| Adjuntos (imagen, PDF, audio, límite 1 MB, fallo sin adjunto falso) | Pendiente en el dispositivo. El circuito ya está en el código (`1a1895a`).                                                                                                                                                                                                                                                                                                |
| Segundo plano durante una sesión                                    | Pendiente, mismo motivo.                                                                                                                                                                                                                                                                                                                                                  |

## Verificación aparte del teléfono

- Tests de `hardwareBackAction`: pasan.
- La versión web de la app no usa el botón atrás de Android. Con Cliente Cinco sigue abriendo Inicio, Tests físicos y la flecha de atrás vuelve a Más.
