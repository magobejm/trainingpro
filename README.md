# Monorepo boundaries

- `packages/ui` is presentational only.
- No API calls from `packages/ui`.
- Data fetching belongs in `apps/*/src/data` or `apps/*/src/hooks`.

---

## Base de datos local

La BD de desarrollo local es **Supabase CLI** (puerto 54322). Estos comandos arrancan o detienen ese stack y **conservan los datos**:

```powershell
pnpm db:up
pnpm db:down
.\scripts\start-dev.ps1
```

`pnpm db:up` y `pnpm db:down` no existen como atajo de Docker Compose. El script `db:reset` se eliminó.

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

| Comando                                    | Por qué es peligroso                                               |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `prisma migrate reset`                     | Elimina el schema público completo y lo recrea desde cero          |
| `prisma migrate dev`                       | Puede proponer un reset automático si detecta drift en el schema   |
| `supabase db reset`                        | Elimina y recrea toda la BD pública                                |
| `docker volume rm supabase_db_trainingpro` | Destruye el volumen de datos de Supabase                           |
| `pnpm db:ci:reset`                         | Borra el volumen de Compose. Exige confirmación y no toca Supabase |

**Para aplicar migraciones de schema usa siempre:**

```powershell
pnpm --filter @trainerpro/api db:migrate:deploy
```

Este comando es seguro — solo aplica las migraciones pendientes sin tocar los datos existentes.

### El `docker-compose.yml` es SOLO para CI

El `docker-compose.yml` de la raíz arranca un Postgres independiente (`trainerpro-postgres`, puerto 5432, base `trainerpro_dev`) para validar migraciones fuera de Supabase. **No lo uses como base de desarrollo local.**

```powershell
pnpm db:ci:up
pnpm db:ci:down
```

`db:ci:down` solo detiene el contenedor. El único comando que borra ese volumen es `db:ci:reset`, y no arranca si falta la confirmación. Cuando sí corre, las migraciones y el seed usan la URL de Compose, no el `DATABASE_URL` de Supabase:

```powershell
$env:CONFIRM_DB_RESET = 'ci-postgres'
pnpm db:ci:reset
```
