# TP-25 · Timers al cambiar de estado de la app

Fecha: 2026-10-12

| Dato        | Valor                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------ |
| App         | Trainer Pro Mobile, APK `assembleRelease`                                                                    |
| Paquete     | `com.trainerpro.mobile`                                                                                      |
| Build       | `TRAINERPRO_LAN_BUILD=1` (HTTP permitido, OTA apagadas). El bundle apunta a la API y al auth de la red local |
| Dispositivo | Google Pixel 10 Pro, serie `58021FDCH0070X`                                                                  |
| API         | `http://192.168.1.136:8080` (health 200 desde esa IP)                                                        |
| Supabase    | `http://192.168.1.136:55421` (auth health 200 desde esa IP)                                                  |
| Firewall    | Reglas de entrada `TrainerPro LAN 8080` y `TrainerPro LAN 55421`, habilitadas, acción Permitir               |

La instalación con `adb install -r` terminó en Success. La firma coincide con la de TP-22, así que no hizo falta desinstalar. La primera apertura pedía login. Tras entrar con client5 se reinstaló una segunda APK con el arreglo del día del calendario; la sesión se conservó.

El bundle de release no se generaba desde la raíz del monorepo (`index.js` no está ahí). Hizo falta `EXPO_NO_METRO_WORKSPACE_ROOT=1` para que Metro use `apps/mobile`. El JS empaquetado contiene el host de la red local y no `localhost`.

## Recorrido en el teléfono

| Punto                            | Resultado                                                                                                                                                                                                                                                                                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Día del calendario               | Al abrir el 6 de octubre la pantalla se quedaba negra. `TimeSelect` usaba `<select>` y `<option>`, que en la APK rompen la vista. En la web no pasa. Se sustituyó por un control de React Native, también en el chat. Tras reinstalar, el día muestra notas, agendar llamada y ver sesión                                              |
| Login con client5                | Hecho en el teléfono. La contraseña no se ha impreso ni cambiado                                                                                                                                                                                                                                                                       |
| Bloqueo 20 s                     | Descanso de 120 s en Ab-wheel, serie 1. De 48 s a 23 s en 24 s de reloj. No volvió a 120 ni se quedó parado                                                                                                                                                                                                                            |
| Segundo plano hasta que vence    | Al volver, la serie 1 muestra «Descanso hecho» una sola vez. Las series 2 y 3 siguen con el botón de 120 s                                                                                                                                                                                                                             |
| Proceso muerto                   | `am kill` con 45 s restantes. Al abrir otra vez, el mismo ejercicio muestra 1 s, 44 s de reloj después. No se reinició                                                                                                                                                                                                                 |
| Reloj de la sesión               | Pasó de 147 h 10 min a 147 h 18 min mientras había bloqueo y segundo plano. Sigue contando porque la sesión del 6 de octubre sigue en curso                                                                                                                                                                                            |
| Sin red y fin de sesión          | No se pueden guardar series ni terminar: la API responde que la ventana de edición de ese día ha caducado. El intento de guardar la serie 3 devolvió 403 y no quedó fila en el servidor                                                                                                                                                |
| Cambio de hora del sistema       | Correcto. Con el descanso en 119 s se atrasó una hora: el teléfono marcaba 17:07 y el descanso seguía en 50 s, sin volver a 120. El reloj de la sesión bajó a 146 h 21 min. Al activar otra vez la hora automática, el reloj volvió a 18:09, la serie 3 quedó en «Descanso hecho» una sola vez y el reloj de la sesión en 147 h 23 min |
| Intervalos de cardio en pantalla | No hay ruta para `IntervalTimer`. Lo cubre Jest                                                                                                                                                                                                                                                                                        |

## Verificación en el navegador

Expo web en el puerto 19006, con client5. La sesión en curso usada es la del 6 de octubre. La de hoy ya estaba terminada desde TP-24.

| Punto                                   | Resultado                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cuenta atrás en primer plano            | De 120 s bajó a 115 s en unos 5 s, alineada con el reloj                                                                                                                                                                                                                                                                                   |
| Página congelada y vuelta               | Cada descanso que venció mientras la página estaba congelada quedó una sola vez como completado                                                                                                                                                                                                                                            |
| Recarga a mitad del descanso            | Al volver a abrir la sesión, el mismo ejercicio apareció con 107 s, que es lo que faltaba según la marca de fin                                                                                                                                                                                                                            |
| Hora atrasada una hora                  | El descanso pasó de 91 s a 90 s. No volvió a 180 s. La marca de fin se desplazó una hora. El reloj de la sesión bajó de 146 h a 145 h y no salió negativo                                                                                                                                                                                  |
| Hora adelantada                         | Al restaurar el reloj, el descanso terminó una sola vez y el botón pasó a hecho                                                                                                                                                                                                                                                            |
| Fin rechazado por la ventana de edición | La sesión del 6 de octubre no se puede terminar hoy (la API responde que la ventana de edición ha caducado). El descanso sigue en marcha. Antes, el estado optimista de “terminada” borraba el descanso aunque el servidor rechazara el fin; ahora solo se borra si el servidor ya está terminada o si el envío queda aceptado o pendiente |
| Sesión ya terminada                     | El reloj de la sesión de hoy queda en 08:57, que es la diferencia entre el inicio y el fin guardados, y no avanza al cabo de un segundo. No queda una entrada de timer de esa sesión. La del 6 de octubre se conserva                                                                                                                      |

Jest de `countdown` y del store de timers, el lint de los archivos tocados y el typecheck de mobile pasan.

## Efecto sobre client5

No se archivó la cuenta ni se cambió el día del plan. La sesión del 6 de octubre sigue en curso. Los descansos no escribieron series: en el navegador no había serie guardada, y en el teléfono el servidor rechazó el guardado por la ventana de edición. La sesión de hoy sigue terminada, como quedó en TP-24. No se adjuntan capturas.
