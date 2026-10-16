# Coach móvil: matriz de implementación y aceptación

Actualizado: 16 de octubre de 2026. Rama: `codex/mobile-coach-parity`.

Las pantallas del coach utilizan los tokens `LIGHT`, tarjetas y controles táctiles de la app cliente. El cliente conserva su configuración de navegación de tres pestañas. La nueva configuración del coach tiene Inicio, Clientes, Agenda, Chat y Más.

## Matriz de paridad

| Fase | Operaciones de la web                                                                                 | Pantalla móvil                                | Comprobación disponible                                                                                                                                        |
| ---- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Resumen de clientes, agenda del día e incidencias abiertas                                            | `CoachHomeScreen`                             | Recorrido RN Web con respuestas sintéticas; datos y accesos visibles                                                                                           |
| 1    | Navegación, Atrás y destinos de notificaciones                                                        | `CoachShell`, `coach-navigation`              | Pruebas de pila, conservación de origen y cierre de operaciones antiguas                                                                                       |
| 1    | Preferencias de notificaciones, cuenta, idioma, cambio de rol y cierre de sesión                      | `CoachSettingsScreen`, `CoachAccountForm`     | Tipos y compilación; permisos y cambios de cuenta pendientes de dispositivo/cuenta de prueba                                                                   |
| 2    | Buscar, filtrar y ordenar clientes; foto o iniciales, objetivo y estado                               | `CoachClientsScreen`, `ClientCardRow`         | Pruebas de filtros/orden y recorrido RN Web                                                                                                                    |
| 2    | Alta, edición, archivo, avatar y recuperación de acceso                                               | `ClientProfileScreen`                         | Pruebas de transformación/validación; apertura de ficha RN Web; proceso con API real pendiente                                                                 |
| 2    | Conversación por cliente, historial, envío, adjuntos y convocatorias según rol                        | `ChatScreen`, `ChatHistoryList`               | Recorrido de 160 mensajes; tres páginas antiguas, sin IDs duplicados; refresco con mensaje 161 conserva scroll; contador lleva al final                        |
| 3    | Semana/mes, día seleccionado, filtros por cliente y agenda propia                                     | `CoachCalendarScreen`                         | Pruebas de fechas, años bisiestos y desplazamientos de mes; recorrido RN Web                                                                                   |
| 3    | Crear, editar y eliminar notas, recordatorios, entrenamientos y llamadas                              | `CoachCalendarScreen`                         | Eliminación de llamada pendiente comprobada con API simulada; modificación/cancelación delegadas a las operaciones existentes de API                           |
| 3    | Elegir día de rutina del cliente                                                                      | `CalendarEditor`                              | Cambiar de cliente reinicia el día y guardar exige que pertenezca a su rutina actual                                                                           |
| 4    | Sesiones, resultados, volumen, marcas, esfuerzo, filtros y exportación                                | `CoachProgressScreen`, `CoachSessionView`     | Cálculos/contratos compartidos, tipos y compilación; equivalencia con datos reales pendiente                                                                   |
| 4    | Bienestar, medidas y fotos de progreso: subir, archivar, restaurar y eliminar                         | `CoachClientHealthScreen`                     | Comprobación de revisión antes de guardar medidas; subida y permisos nativos pendientes                                                                        |
| 4    | Asignar/desasignar pruebas físicas, programar y registrar resultados                                  | `CoachTestsScreen`                            | Pruebas de campos compartidos y API; el registro del coach transmite `scheduleId` al repositorio                                                               |
| 4    | Filtrar incidencias, revisar, responder, etiquetar y guardar ajuste                                   | `CoachIncidentsScreen`, `CoachIncidentView`   | Tipos/compilación y rutas existentes; recorrido con API real pendiente                                                                                         |
| 4    | Notas generales y de cliente, fechas, paginación y CRUD                                               | `CoachNotesScreen`                            | RN Web: fallo de guardado conserva texto, reintento guarda; pruebas de revisión y búsqueda en páginas anteriores                                               |
| 5    | Fuerza, cardio, isométricos, pliometría, movilidad, deportes y alimentos                              | `CoachLibraryScreen`                          | Siete categorías recorridas en RN Web; pruebas de correspondencia de filtros con API                                                                           |
| 5    | Búsqueda, filtros, detalle, contenido propio/compartido, alta, edición, copia, eliminación y archivos | `CoachLibraryScreen`                          | Apertura del editor RN Web, revisión fresca antes de editar; operaciones reales/archivos pendientes                                                            |
| 6    | Rutina: plan, días, bloques, grupos, series, técnicas, bloqueos, calentamientos y NEAT                | `CoachRoutineEditor`, `CoachPlanBlockEditor`  | Esquema compartido con API; pruebas de normalización de grupos, rangos de peso y conservación de series avanzadas                                              |
| 6    | Añadir, duplicar, eliminar y mover ejercicios y días; asignar a cliente                               | `CoachRoutineDayActions`, `coach-plan-model`  | RN Web: creada/asignada rutina de dos días con ejercicio/serie; prueba de movimiento entre días con grupo y series; reintentos de guardado/asignación probados |
| 6    | Calentamientos: bloques, circuitos, series, notas, bloqueos, copia y guardado                         | `CoachPlannerScreen`                          | Esquema compartido con API y guardado idempotente; solo se ofrecen controles compatibles con el contrato actual                                                |
| 7    | Comidas, alimentos y planes libres/estructurados; objetivos, totales y asignación                     | `CoachNutritionScreen`, editores de nutrición | Cálculos extraídos de la web a shared; pruebas de cantidades/totales y guardado/asignación                                                                     |
| 7    | Copias, conflictos, borradores y puntos de seguimiento                                                | Editores de nutrición                         | Claves por origen/cliente; reintentos reutilizan publicación; API actual de seguimiento permite consultar/crear                                                |
| 8    | Selección de imagen/vídeo, previsualización, análisis y reintento (20 MB)                             | `CoachEvaluatorScreen`                        | Pruebas de formato/tamaño/respuesta; integración con selector y reproducción nativa pendiente                                                                  |
| 8    | PDF de rutinas, calentamientos, nutrición, sesiones/progreso y análisis                               | `CoachPdfButton`, `coach-document`            | Pruebas de modelo/escape HTML; generación y hoja de compartir nativas pendientes                                                                               |

## Borradores y concurrencia

- Almacenamiento separado por usuario, rol y recurso; copias de biblioteca/nutrición también por origen y cliente.
- Las escrituras requieren acción explícita. No se añade una cola de mutaciones para el coach.
- Una petición antigua no puede cerrar un editor nuevo ni eliminar su borrador: se comprueban la identidad del editor y la revisión almacenada.
- Las escrituras tardías de un editor anterior utilizan comparación con la revisión conocida; el cierre de sesión invalida su generación.
- Notas, agenda, medidas, biblioteca, cuenta, ficha y nutrición comprueban datos recientes antes de modificar. Rutinas y calentamientos utilizan la versión esperada del servidor.
- Las plantillas persisten el UUID de guardado antes de publicar; los reintentos de asignación reutilizan ID y versión.
- Los errores conservan el contenido visible y ofrecen reintento. Cambiar de contexto utiliza otra clave de consulta y de borrador.

## Validación ejecutada

- Jest móvil: 220 pruebas en 51 suites (repetidas tras las correcciones de integración local). Shared: 49 pruebas en 8 suites. Vitest web: 315 pruebas en 50 archivos. Contratos HTTP y pruebas físicas de API: 21 pruebas en 6 suites. Todas correctas.
- TypeScript en móvil, web, API, shared y UI; lint de los archivos afectados.
- Producción web con Vite y exportación Metro/Hermes para Android, iOS y web.
- Compilación de API correcta en un directorio de salida aislado; el `dist` local existente tenía cuatro archivos bloqueados con `EPERM`.
- RN Web a 390 × 844 con datos sintéticos: Inicio, Clientes, ficha, notas con fallo/reintento, agenda/eliminación, categorías/editor de biblioteca y chat paginado con refresco.

Los primeros recorridos utilizaron respuestas simuladas. El 16/10/2026 se añadió la integración real descrita a continuación. React Native Web no sustituye la aceptación en Android/iOS.

## Integración real local · 16/10/2026

Servicios: API http://localhost:8080, web http://127.0.0.1:5173 y Expo Web http://localhost:19006, con Supabase local (puerto 55421). Autenticación real de coach y cliente, sin interceptar ni simular respuestas. Datos exclusivos de prueba: **QA Móvil Local 20261016**.

| Recorrido                 | Resultado comprobado                                                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alta y edición de cliente | Guardado real y ficha visible en web, 170 cm y 65 kg.                                                                                                                                             |
| Rutina mixta y asignación | Dos días con fuerza, cardio e isométricos; rutina asignada visible en ficha web.                                                                                                                  |
| Agenda y convocatorias    | Crear llamada pendiente, modificarla y eliminarla desde móvil. El cambio crea otra convocatoria; ambas quedan anuladas en chat. Aceptar la original con cuenta cliente devuelve 409.              |
| Chat e historial          | Conversación de más de 160 mensajes, cuatro páginas, sin IDs duplicados. Mensaje entrante real conserva la posición al leer arriba; contador y envío propio comprobados.                          |
| Notas                     | Alta y edición desde móvil, persistencia y nota visible en línea temporal web.                                                                                                                    |
| Progreso y bienestar      | Endpoints reales responden 200; cliente QA sin sesiones: se verifican estados vacíos, no equivalencia de gráficas pobladas.                                                                       |
| Pruebas físicas           | Asignar, programar y registrar plancha de 90 segundos desde móvil; programación finalizada y resultado visible en línea temporal web.                                                             |
| Incidencias               | Alta con cuenta cliente; revisar, responder, etiquetar y guardar ajuste desde móvil, con lectura posterior de la API.                                                                             |
| Bibliotecas               | Siete categorías consultadas en móvil con respuestas 200; alta y edición de un alimento propio, verificadas en API.                                                                               |
| Nutrición                 | Comida con 50 g de avena, plan estructurado y asignación desde móvil. Web muestra plan, comida y objetivos: 2250 kcal, 169 g proteína, 253 g hidratos y 63 g grasa. API cliente devuelve el plan. |

Correcciones surgidas del recorrido real:

- Progreso enviaba marcas de tiempo donde los contratos requieren fechas YYYY-MM-DD y recibía 400. Se unificó la construcción de parámetros y se añadió una prueba de regresión.
- La programación de pruebas del coach tiene un contrato distinto del cliente. El listado intentaba leer physicalTest.name y fallaba; ahora usa physicalTestName y resuelve el catálogo para registrar resultados. Se añadió una prueba de regresión.
- Se ocultan los colores técnicos de clasificación y se evita repetir el último resultado en su historial.

Limitaciones observadas: imágenes antiguas de biblioteca apuntan al almacenamiento local del puerto 54321, actualmente inactivo; los datos actuales usan 55421. La ficha web conserva algunos resúmenes genéricos (por ejemplo, nutrición), aunque el detalle del plan estructurado muestra correctamente los datos guardados. No se ha probado análisis externo de IA, subida nativa, PDF/compartir nativos ni una sesión completa con resultados de entrenamiento.

## Aceptación que todavía debe realizarse

- [ ] Android e iOS: teclado, áreas seguras, texto ampliado, permisos, selector de archivos, vídeo, PDF y compartir.
- [ ] Alta → rutina mixta completa → asignación → agenda → sesión del cliente → progreso, usando una API real de pruebas.
- [ ] Comprobar en dispositivos nativos incidencia → respuesta → conversación y convocatorias desde ambos roles. En RN Web ya están probados revisión/respuesta e invalidación de llamadas con API real.
- [ ] Plan nutricional completo → asignación → seguimiento, contrastando cantidades y totales con la web.
- [ ] Borradores tras cerrar por completo la app y conflictos tras editar desde web; sin envío automático al reconectar.
- [ ] Notificaciones con la app cerrada, recursos eliminados y permisos sobre clientes de otro coach.
- [ ] Regresión visual del cliente en ambos sistemas operativos.

En este entorno Windows no hay un AVD configurado ni un entorno iOS; no se ha instalado la app en dispositivos físicos disponibles para otros proyectos.

## Publicación

La API sigue siendo compatible y no necesita migración de datos. El ajuste del resultado de pruebas físicas debe publicarse antes del móvil. Los esquemas de rutina/calentamiento se comparten sin alterar su forma pública; los contratos HTTP siguen comprobándose.

Se añaden `expo-video`, `expo-print`, `expo-sharing` y `expo-file-system` compatibles con el SDK instalado. La versión móvil pasa a 1.3.0 para separar su runtime. Es necesaria una nueva compilación nativa para Android e iOS; estos módulos no deben entregarse únicamente por OTA.
