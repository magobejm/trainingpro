# IDEA-02 · Versiones de rutina

La revisión de TP-43 compara el contenido aplicado con el propuesto antes de asignar,
incluidos días, ejercicios, series, descansos, agrupaciones, notas, calentamientos y NEAT.
Guardar una plantilla no cambia la rutina aplicada. Cada asignación conserva una
referencia inmutable; los días anteriores siguen disponibles para eventos y sesiones.

El historial de la ficha del cliente muestra las asignaciones, su contenido y sus
diferencias frente a la actual. No es un historial de cada guardado de plantilla.
La primera referencia de clientes existentes se identifica como «Referencia inicial»:
no reconstruye versiones que ya se habían sobrescrito antes de esta implantación.

## Despliegue

1. Pausar las escrituras de plantillas y asignaciones durante esta primera actualización.
   La API anterior elimina días al guardar y no conoce las referencias nuevas.
2. Aplicar las migraciones 0033–0035 y regenerar Prisma.
3. Ejecutar `pnpm --filter @trainerpro/api db:backfill:routine-assignments` con conexión
   directa a PostgreSQL. Es idempotente y captura las asignaciones aún sin referencia.
   El workflow de despliegue ya lo ejecuta después de las migraciones.
4. Desplegar la API nueva, retirar todas las instancias antiguas y reanudar escrituras.
5. Desplegar la web. La web comprueba la capacidad `routineVersions` antes de revisar.

No volver a una API anterior sobre este esquema mientras se permitan escrituras de
plantillas. Las aplicaciones móviles conservan sus contratos actuales.

## Validación

- PostgreSQL real, `connection_limit=1`: guardar una plantilla conserva el día aplicado,
  instrucciones y calentamientos; confirmar conserva sesiones iniciadas y eventos de
  versiones anteriores; una propuesta obsoleta devuelve 409 sin asignación parcial.
- Pruebas compartidas: bloques de fuerza, cardio, pliometría, movilidad, isométricos
  y deportes; cambios de prescripción, orden, altas, bajas e identidades regeneradas.
- Contratos: OpenAPI y compatibilidad de la respuesta anterior de TP-43.
- QA con Luna contra API y web locales: comparación v1→v2, cancelar sin cambios,
  continuar conservando los eventos, consultar v1 desde el historial, conflicto al
  cambiar la fuente a v3 y confirmación manual posterior, «Guardar y asignar».

En la comprobación a 390 px se observó recorte en el título del calendario y un aviso
React de claves en `EmptyIllustration`, fuera de los componentes nuevos de versiones.
