# Monorepo boundaries

- `packages/ui` is presentational only.
- No API calls from `packages/ui`.
- Data fetching belongs in `apps/*/src/data` or `apps/*/src/hooks`.

---

## Base de datos local

La BD de desarrollo local es **Supabase CLI** (puerto 54322). Arrancar con:

```powershell
.\scripts\start-dev.ps1
```

### Restaurar datos de prueba tras un reset accidental

```powershell
# 1. Catálogo (ejercicios, métodos cardio, plantillas…)
pnpm --filter @trainerpro/api db:seed

# 2. Organización + coach + cliente de prueba
pnpm --filter @trainerpro/api db:seed:dev
```

Usuarios de prueba (passwords en el gestor de contraseñas del equipo):

- **Coach web** → `coach1@example.com`
- **Cliente móvil** → `client5.coach1@example.com`

### ⚠️ Comandos PROHIBIDOS en desarrollo local

Los siguientes comandos **borran TODOS los datos** de la BD sin posibilidad de recuperación:

| Comando                                    | Por qué es peligroso                                             |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `prisma migrate reset`                     | Elimina el schema público completo y lo recrea desde cero        |
| `prisma migrate dev`                       | Puede proponer un reset automático si detecta drift en el schema |
| `supabase db reset`                        | Elimina y recrea toda la BD pública                              |
| `docker volume rm supabase_db_trainingpro` | Destruye el volumen de datos de Supabase                         |

**Para aplicar migraciones de schema usa siempre:**

```powershell
pnpm --filter @trainerpro/api db:migrate:deploy
```

Este comando es seguro — solo aplica las migraciones pendientes sin tocar los datos existentes.

### El `docker-compose.yml` es SOLO para CI

El `docker-compose.yml` de la raíz del proyecto arranca un Postgres independiente (`trainerpro-postgres`, puerto 5432) que usa el pipeline de CI para validar migraciones. **No lo uses para desarrollo local** ni ejecutes `docker compose up` manualmente.
