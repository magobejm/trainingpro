# TP-14 · Mediciones de las consultas con más volumen

Medición local contra la organización sintética `perf`. No toca client5, los usuarios de QA ni coach1. No se añadió la migración `0029`: ningún índice de prueba mejoró el plan.

## Volumen

El manifiesto de `.run/perf/manifest.json` usa los valores por defecto de `apps/api/scripts/perf/perf-config.ts`:

- 150 clientes, con `client_limit` de la suscripción en 170.
- 52 semanas a 3 sesiones por semana, completadas, con 4 ejercicios y 3 series cada una.
- 8 fotos de progreso por cliente.
- 12 eventos de calendario por cliente.
- 100 elementos de cada tipo de biblioteca (ejercicio, alimento, cardio, pliometría, movilidad, isométrico y deporte) para el entrenador medido y otros 100 para un segundo entrenador.
- 80 rutinas, 15 plantillas de cardio y 20 calentamientos.
- 3000 mensajes en un hilo.

## Cómo se midió

Cada endpoint se llamó 20 veces desde un `AppModule` de prueba, sustituyendo solo `TOKEN_VERIFIER`. Se guardan la mediana, el p95, las consultas de Prisma por petición, los bytes de la respuesta y el `EXPLAIN (ANALYZE, BUFFERS)` de la consulta más lenta. Los JSON están en `.run/perf/`, fuera de git.

La comparación exige el mismo cuerpo salvo en tres respuestas declaradas en `apps/api/scripts/perf/perf-compare.ts`:

- `clients.list`: la lista deja de incluir fotos. La ficha sigue trayéndolas.
- `library.exercises.all`: solo entran los ejercicios globales y los del propio entrenador, y el ejercicio de fuerza usa un `select` más corto.
- `chat.messages`: la página pasa a ser la de los 50 mensajes más recientes, en orden ascendente.

El resto de cuerpos coincidió, incluido el récord de ejercicio y los récords del microciclo.

## Antes y después

| Endpoint                 |      Mediana |          p95 | Consultas |             Bytes |
| ------------------------ | -----------: | -----------: | --------: | ----------------: |
| `clients.list`           |   82 → 34 ms |   99 → 47 ms |     4 → 3 |   431495 → 114845 |
| `clients.one`            |   24 → 24 ms |   29 → 28 ms |     6 → 6 |       3731 → 3731 |
| `calendar.all`           |  101 → 91 ms | 136 → 109 ms |     6 → 6 |   192736 → 192736 |
| `calendar.client`        |   29 → 30 ms |   34 → 32 ms |     7 → 7 |       1291 → 1291 |
| `me.calendar`            |   22 → 23 ms |   27 → 26 ms |     5 → 5 |         640 → 640 |
| `me.sessions`            |   13 → 12 ms |   14 → 14 ms |     2 → 2 |       4735 → 4735 |
| `me.summary`             |   16 → 16 ms |   19 → 20 ms |     3 → 3 |           65 → 65 |
| `library.exercises.all`  | 311 → 205 ms | 380 → 257 ms |   27 → 26 | 1516520 → 1025016 |
| `library.exercises`      |   71 → 68 ms |  103 → 73 ms |     4 → 4 |   268493 → 268493 |
| `library.foods`          |   32 → 32 ms |   37 → 37 ms |     2 → 2 |   144993 → 144993 |
| `plans.routines`         | 115 → 111 ms | 183 → 120 ms |   24 → 24 |   242262 → 242262 |
| `plans.routines.summary` |   21 → 20 ms |   25 → 22 ms |     3 → 3 |     17334 → 17334 |
| `plans.cardio`           |   20 → 20 ms |   23 → 23 ms |     5 → 5 |       7622 → 7622 |
| `plans.warmups`          |   17 → 17 ms |   22 → 24 ms |     4 → 4 |     48978 → 48978 |
| `progress.overview`      |   55 → 49 ms |   78 → 75 ms |   15 → 11 |       2039 → 2039 |
| `progress.exercise`      |   30 → 31 ms |   36 → 36 ms |     5 → 5 |     20979 → 20979 |
| `progress.pr`            |   44 → 18 ms |   91 → 21 ms |     3 → 3 |             2 → 2 |
| `progress.performed`     |   28 → 26 ms |   36 → 34 ms |     9 → 9 |         496 → 496 |
| `progress.templates`     |   19 → 20 ms |   23 → 25 ms |     4 → 4 |           84 → 84 |
| `progress.days`          |   20 → 16 ms |   25 → 17 ms |     3 → 3 |           11 → 11 |
| `progress.session`       |   44 → 43 ms |   53 → 49 ms |   10 → 10 |       9843 → 9843 |
| `progress.microcycle`    |  136 → 91 ms |  177 → 96 ms |   16 → 15 |       1757 → 1757 |
| `progress.recent`        |   27 → 27 ms |   37 → 30 ms |     5 → 5 |       3381 → 3381 |
| `chat.messages`          |   19 → 19 ms |   25 → 20 ms |     6 → 6 |     15451 → 15342 |

## Qué se cambió

- La lista de clientes ya no carga `progressPhotos`. Sigue devolviendo el resto de campos del contrato, con `progressPhotos: []`, porque la web, el chat y el calendario reutilizan esa lista. La ficha usa otra consulta (`clients/detail`) y conserva las fotos. No hay paginación: el tope es el `client_limit` de la suscripción.
- El calendario, las sesiones y el resumen aceptan como máximo 62 días inclusivos. El bienestar acepta 93, porque la web y la APK piden 84 días hacia atrás (85 inclusivos) tanto en `/clients/me/wellness` como en `/clients/{clientId}/wellness`. El progreso acepta 400 días. El modal de rango personalizado de la web no confirma un tramo mayor.
- La APK pide una sola rejilla de 42 días del mes visible y deriva la semana de esos datos.
- `GET /library/exercises/all` queda limitado al ámbito `GLOBAL` y a los elementos del entrenador autenticado. El ejercicio de fuerza selecciona las columnas que pinta la lista. El selector de nombres ya usaba `summary=true`; el hook de cardio ahora también puede pedirlo. Las tarjetas de la biblioteca de rutinas siguen pidiendo el árbol completo porque muestran el número de días y la imagen.
- El resumen de progreso resuelve el cliente una vez y reutiliza ese id en las tres lecturas.
- El récord de un ejercicio sale de las sesiones de ese cliente, no de un recorrido de todo `set_log`. El máximo previo del microciclo se calcula en SQL con la misma fórmula `estimateE1rm`, y el cuerpo no cambió.
- El chat devuelve los 50 mensajes más recientes en orden ascendente. `before` pide la página anterior. El índice `(thread_id, created_at)` ya existía.

## Índices que no se añadieron

El `EXPLAIN` de la consulta más lenta, después de los cambios, sigue en milisegundos bajos. Se probaron y se borraron estos índices; el catálogo ya no los tiene:

- `(coach_membership_id, created_at DESC) WHERE archived_at IS NULL` en `client`. Tras quitar las fotos, ordenar 150 filas cuesta unas décimas de milisegundo y el planificador siguió haciendo un seq scan.
- `(coach_membership_id, kind, archived_at)` en `plan_template`. El resumen ordena 82 filas en 0,2 ms.
- `session_strength_item (source_exercise_id)`. El plan que parte de las sesiones del cliente ejecuta el récord en 1,9 ms. Con el índice, el planificador partía del ejercicio compartido por los 150 clientes y la misma consulta empeoraba.
- Un índice parcial de `session_instance` por `is_completed`. El resumen y las sesiones ya usan `uq_session_client_date` y filtran `is_completed` en el heap, por debajo de 1 ms.
- El calendario ya usa `idx_calendar_event_coach_date` y `idx_calendar_event_client_date`.

## Cómo repetirla

Desde `apps/api`, con la base local descrita en el `.env` de la raíz. El seed borra y vuelve a crear solo la organización `perf`.

```powershell
cd apps/api
node --env-file=../../.env -e "const {spawnSync}=require('child_process'); const r=spawnSync('pnpm',['perf:seed'],{stdio:'inherit',shell:true}); process.exit(r.status??1)"
node --env-file=../../.env -e "const {spawnSync}=require('child_process'); const r=spawnSync('pnpm',['perf:measure'],{stdio:'inherit',shell:true,env:{...process.env,PERF_COMPARE:'1'}}); process.exit(r.status??1)"
```

Sin `PERF_COMPARE`, la medición escribe `.run/perf/before.json` y sustituye la línea base. Con `PERF_COMPARE=1` escribe `after.json` y falla si alguna respuesta no declarada cambia. `pnpm perf:teardown` borra solo esa organización. `PERF_ITERATIONS` admite de 1 a 50. El runner no forma parte de `pnpm test`.
