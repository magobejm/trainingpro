# TP-13 · Zona horaria de la sesión y resultado esperado

La sesión guarda el día local que manda la app en `sessionDate` (`YYYY-MM-DD`). La APK lo calcula con la hora del teléfono, no con UTC.

La edición cierra a las 23:59:59.999 de ese día. La hora local sale de la cabecera `X-Timezone-Offset`: minutos al este de UTC. España en verano es `120`; en invierno, `60`. La APK envía `-getTimezoneOffset()`.

Un valor ausente, no numérico o fuera de −720..840 (el rango real de husos) cuenta como `0`. Sin cabecera el día es UTC: en España la edición sigue abierta hasta la 01:59 local en verano o la 00:59 local en invierno del día siguiente.

| Caso                             | Entrada                                                        | Resultado                                           |
| -------------------------------- | -------------------------------------------------------------- | --------------------------------------------------- |
| Último instante del día en UTC+2 | Sesión 2026-09-07, ahora 21:59:59.999Z, desfase 120            | Se permite                                          |
| Un milisegundo después           | Ahora 22:00:00.000Z, desfase 120                               | 403, no se escribe                                  |
| Sesión del día anterior          | Sesión 2026-09-06, 00:30 local (22:30Z), desfase 120           | 403                                                 |
| Cambio a invierno                | Sesión 2026-10-25, 22:30Z, desfase 60                          | Se permite                                          |
| Pasada la medianoche de invierno | Sesión 2026-10-25, 23:00Z, desfase 60                          | 403                                                 |
| Misma madrugada aún en verano    | Sesión 2026-10-25, 01:30 local con desfase 120 (23:30Z del 24) | Se permite                                          |
| Cambio a verano                  | Sesión 2026-03-29, 21:30Z, desfase 120                         | Se permite                                          |
| Pasada la medianoche de verano   | Sesión 2026-03-29, 22:00Z, desfase 120                         | 403                                                 |
| Sin cabecera                     | Sesión 2026-09-07, 23:30Z, desfase 0                           | Se permite                                          |
| Sin cabecera, día UTC cerrado    | Sesión 2026-09-07, 00:00Z del 8                                | 403                                                 |
| Desfase inventado                | Cabecera `841` o `-721`                                        | Se trata como UTC                                   |
| Sesión cerrada                   | Estado COMPLETED                                               | 400, no se escribe                                  |
| Sesión iniciada                  | IN_PROGRESS y otro día del plan, o plantilla más nueva         | Se devuelve la misma fila; no se carga la plantilla |
| Sesión iniciada y archivada      | IN_PROGRESS con `archivedAt`                                   | No se reescribe                                     |
| Peso realizado ausente           | 8 repeticiones y peso null                                     | La serie cuenta, peso y e1RM null, tonelaje 0       |
| Semana sin peso                  | Una fila con repeticiones y peso null                          | `maxWeightKg` null y volumen 0                      |
