# Lista de Verificación para Agentes IA (Codex, Antigravity, Cursor)

**Contexto:** Este proyecto es una plataforma de fitness multiplataforma estricta. Todo el código generado debe adherirse a estas reglas antes de dar por finalizada una tarea, refactorización o corrección.

## 1. Reglas de estilo y Clean Code (ESLint + Prettier)

Límites **reales** aplicados por `.eslintrc.cjs` (salvo exclusiones indicadas):

| Regla                    | Límite                                         | Ámbito       |
| ------------------------ | ---------------------------------------------- | ------------ |
| `max-lines`              | 500 líneas (sin contar blancos ni comentarios) | Todo el repo |
| `max-lines-per-function` | 100 líneas (sin contar blancos ni comentarios) | Todo el repo |
| `max-len`                | 125 caracteres                                 | Todo el repo |

**Exclusiones:**

- **`apps/api/**/_.prisma_.ts`**: sin límite de líneas ni de líneas por función. Incluye repositorios Prisma, helpers y mappers (`_.repository.prisma.ts`, `_.prisma.helpers.ts`, `\*.prisma.mappers.ts`, etc.).
- **`ActiveExerciseScreen.tsx`**: pantalla compleja con matriz de series; si crece, extraer subcomponentes antes de añadir `eslint-disable`.

**Mobile y Web (`apps/mobile`, `apps/web`):**

- No uses strings literales visibles en JSX (`JSXText`). Usa `t('clave.i18n')`.
- No uses strings literales en props JSX salvo `testID`, `accessibilityLabel` y `aria-label`.
- Props técnicas (`animationType`, `variant`, `mode`, `keyboardType`, …) pueden ir como expresión: `animationType={'slide'}` en lugar de `animationType="slide"`.

**Prettier vs ESLint:**

- El pre-commit ejecuta **Prettier antes que ESLint** (`lint-staged`).
- No comprimas JSX en una sola línea para esquivar `max-lines-per-function`: Prettier lo expandirá y el commit fallará.
- Solución: extraer subcomponentes o helpers.

- [ ] ¿El archivo cumple `max-lines` (≤ 500), salvo mappers Prisma?
- [ ] ¿Las funciones cumplen `max-lines-per-function` (≤ 100)?
- [ ] ¿Las líneas tienen ≤ 125 caracteres?
- [ ] ¿Mobile/Web usan i18n para texto visible?

## 2. Reglas arquitectónicas (CLEAN & SOLID)

- [ ] ¿La lógica de negocio está aislada de controladores/UI?
- [ ] ¿Se respeta el Principio de Responsabilidad Única (SRP)?
- [ ] ¿Las dependencias apuntan hacia el dominio?

## 3. Manejo de datos y seguridad (¡Crítico!)

- [ ] ¿Soft delete (`archived_at IS NULL`) en lecturas?
- [ ] ¿Auditoría (`created_by`, `updated_by`) desde el contexto autenticado?
- [ ] ¿Ownership verificado (`assertCoachOwnsClient` o acceso solo a datos propios)?
- [ ] ¿Sin fallbacks de peso objetivo al calcular volumen (`weight_done` como factor)?

## 4. Git: commit y push

### Pre-commit (Husky, automático)

1. **`pnpm lint-staged`** sobre archivos staged:
   - Prettier en `*.{ts,tsx,js,jsx,json,md,yml,yaml}`
   - ESLint `--fix` en `*.{ts,tsx,js,jsx}`
2. **`pnpm -r typecheck`** en todo el workspace.

### Pre-push (Husky, automático)

- **`pnpm -r build`** en todo el workspace (typecheck + build de cada app).

### Antes de commitear (agente o desarrollador)

- [ ] Solo commitear cuando el usuario lo pida explícitamente.
- [ ] No incluir secretos (`.env`, tokens, credenciales).
- [ ] No incluir artefactos generados (`dist/`, builds locales) salvo que el repo los versione a propósito.
- [ ] Mensaje de commit: 1–2 frases en imperativo, foco en el **por qué** (ej.: _Extend API session groups so mobile can render supersets_).

### Antes de push

- [ ] El commit ya pasó pre-commit localmente (o CI equivalente).
- [ ] Push solo cuando el usuario lo pida; no force-push a `main`/`master`.

### Si falla el hook

1. Leer el error (ESLint, typecheck o build).
2. Corregir en código; no usar `--no-verify` salvo petición explícita del usuario.
3. Volver a `git add` + `git commit` (commit **nuevo**, no `--amend` si el hook rechazó el anterior).

## 5. Control de calidad pre-PR

- [ ] `pnpm -r lint` sin errores.
- [ ] `pnpm -r typecheck` sin errores.
- [ ] `pnpm -r build` pasa correctamente.
- [ ] **Cada use-case nuevo de la API tiene su `.spec.ts`** (camino feliz, errores de dominio, acceso no autorizado). Obligatorio en PRs.
- [ ] Tests unitarios actualizados (Guards, Ownership, utils mobile con lógica de negocio).
- [ ] Sin secretos en el código.

## 6. Mantenimiento y desarrollo

- [ ] **¿Cambio en el esquema Prisma?** Reinicia API y Web en local para reflejar cambios.
- [ ] **¿Nuevas claves i18n mobile/web?** Añadir en `es` y `en`.
