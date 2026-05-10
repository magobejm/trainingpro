# Despliegue: Supabase + Cloud Run + Firebase Hosting

Guía manual para preparar la nube. El **agente IA no debe** ejecutar nada de aquí: requiere credenciales y decisiones de coste.

Stack:

- **DB + Storage:** Supabase prod (un solo proyecto, free tier).
- **API:** Google Cloud Run (`europe-southwest1`, Madrid).
- **Web:** Firebase Hosting (mismo proyecto GCP).
- **CI/CD:** GitHub Actions con Workload Identity Federation (sin keys JSON).

Coste objetivo: <2 USD/mes con tráfico bajo.

---

## 1. Supabase prod

1. Crear proyecto en https://supabase.com → región `eu-west-*`.
2. **Database → Connection string**:
   - Copiar `URI` puerto **5432** → este es `DIRECT_URL` (para `prisma migrate`).
   - Copiar `Transaction pooler` puerto **6543** + `?pgbouncer=true&connection_limit=1` → este es `DATABASE_URL` (runtime API).
3. **Project Settings → API**:
   - Copiar `URL` → `SUPABASE_URL`.
   - Copiar `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY` (mantener oculto).
   - Copiar `anon` public key → `EXPO_PUBLIC_SUPABASE_ANON_KEY` (web).
4. **Storage → New bucket**: `trainerpro-prod`, **privado**. El adaptador (`apps/api/src/modules/files/infra/supabase/supabase-storage.adapter.ts`) sube con service-role y sirve URLs firmadas.
5. **Aplicar primera migración manualmente** desde local antes de activar CI:
   ```bash
   DIRECT_URL='postgresql://...:5432/postgres' \
   DATABASE_URL='postgresql://...:5432/postgres' \
     pnpm --filter @trainerpro/api db:migrate:deploy
   ```

---

## 2. Google Cloud Platform

### 2.1 Proyecto y APIs

1. Crear proyecto `trainerpro-prod`. Habilitar billing (tarjeta).
2. Anotar `PROJECT_ID` y `PROJECT_NUMBER`.
3. Habilitar APIs:
   ```bash
   gcloud services enable \
     run.googleapis.com \
     artifactregistry.googleapis.com \
     secretmanager.googleapis.com \
     iamcredentials.googleapis.com \
     iam.googleapis.com \
     --project=trainerpro-prod
   ```

### 2.2 Artifact Registry (imágenes Docker)

```bash
gcloud artifacts repositories create api-images \
  --repository-format=docker \
  --location=europe-southwest1 \
  --project=trainerpro-prod
```

### 2.3 Secret Manager

Crear los siguientes secrets (cada uno con `--data-file=-` y pegar el valor):

- `DATABASE_URL` (pooler 6543)
- `DIRECT_URL` (5432)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET` → valor `trainerpro-prod`
- `GEMINI_API_KEY`

```bash
echo -n 'postgresql://...' | gcloud secrets create DATABASE_URL --data-file=- --project=trainerpro-prod
# repetir para cada uno
```

### 2.4 Service Account de despliegue

```bash
gcloud iam service-accounts create github-deployer \
  --project=trainerpro-prod

SA="github-deployer@trainerpro-prod.iam.gserviceaccount.com"

for ROLE in roles/run.admin roles/artifactregistry.writer \
            roles/iam.serviceAccountUser roles/secretmanager.secretAccessor \
            roles/firebasehosting.admin; do
  gcloud projects add-iam-policy-binding trainerpro-prod \
    --member="serviceAccount:$SA" --role="$ROLE"
done
```

Dar al SA acceso a usar cada secret (más restrictivo que `secretAccessor` global, opcional pero recomendado):

```bash
for S in DATABASE_URL DIRECT_URL SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY \
         SUPABASE_STORAGE_BUCKET GEMINI_API_KEY; do
  gcloud secrets add-iam-policy-binding $S \
    --member="serviceAccount:$SA" \
    --role=roles/secretmanager.secretAccessor \
    --project=trainerpro-prod
done
```

### 2.5 Workload Identity Federation (auth GitHub → GCP sin JSON keys)

```bash
PROJECT_NUMBER=$(gcloud projects describe trainerpro-prod --format='value(projectNumber)')

gcloud iam workload-identity-pools create github-pool \
  --location=global --project=trainerpro-prod

gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location=global \
  --workload-identity-pool=github-pool \
  --display-name="GitHub Actions" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner=='<TU_USUARIO_GITHUB>'" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --project=trainerpro-prod

# Permitir que el repo asuma el SA
gcloud iam service-accounts add-iam-policy-binding $SA \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/<USUARIO>/<REPO>" \
  --project=trainerpro-prod
```

Anotar el provider full path (lo necesita GitHub):

```
projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/providers/github-provider
```

---

## 3. Firebase Hosting

1. https://console.firebase.google.com → "Add project" → seleccionar el GCP `trainerpro-prod` existente.
2. Hosting → **Get started**, anotar `siteId` (por defecto = projectId).
3. En local:
   ```bash
   pnpm dlx firebase-tools login
   pnpm dlx firebase-tools init hosting
   # public dir: apps/web/dist
   # SPA: yes
   # Set up GitHub Actions: NO (lo gestionamos manual con WIF)
   ```
4. Esto crea `firebase.json` y `.firebaserc` en raíz. Commitearlos.

---

## 4. Secrets en GitHub (Settings → Secrets and variables → Actions)

**Variables:**

- `GCP_PROJECT_ID` = `trainerpro-prod`
- `FIREBASE_SITE` = el `siteId`

**Secrets:**

- `GCP_WORKLOAD_IDENTITY_PROVIDER` = el path de §2.5
- `GCP_SERVICE_ACCOUNT` = `github-deployer@trainerpro-prod.iam.gserviceaccount.com`
- `FIREBASE_SERVICE_ACCOUNT` = JSON de un SA con `roles/firebasehosting.admin` (la action de Firebase aún pide JSON; se puede generar uno limitado solo a Hosting). Ver https://github.com/FirebaseExtended/action-hosting-deploy
- `EXPO_PUBLIC_SUPABASE_URL` = mismo valor que `SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` = anon key

---

## 5. Primer despliegue

1. Verifica que todo lo de §1–4 está hecho.
2. Lanza manualmente el workflow desde GitHub → Actions → Deploy → **Run workflow**.
3. Ver los 3 jobs en orden (`deploy-db` → `deploy-api` → `deploy-web`).
4. Validar:
   ```bash
   curl https://api-<hash>-<region>.a.run.app/health
   open https://<siteId>.web.app
   ```
5. A partir de aquí, cualquier push a `main` despliega automáticamente.

---

## 6. Desarrollo local

Usa **Supabase CLI** — te da DB + Auth + Storage + Studio en un solo stack, fiel a producción.

```powershell
pnpm dlx supabase start         # arranca DB (54322), Auth, Storage, Studio
pnpm dev:webapi                 # API + web (lee apps/api/.env.local)
```

Studio en `http://127.0.0.1:54323`.

`apps/api/.env.local` apunta por defecto a Supabase CLI (puerto 54322 / db `postgres`).

### Workaround: imagen de Postgres no descarga

Si `pnpm dlx supabase start` falla con `EOF` descargando `public.ecr.aws/supabase/postgres:<version>` (problema intermitente de AWS ECR), re-etiqueta una versión cacheada como la nueva:

```powershell
docker images public.ecr.aws/supabase/postgres                                      # ver cacheadas
docker tag public.ecr.aws/supabase/postgres:<vieja> public.ecr.aws/supabase/postgres:<nueva>
pnpm dlx supabase start
```

### El docker-compose Postgres del repo NO es para dev

`docker-compose.yml` define un `postgres:16-alpine` en el puerto 5432. **Solo lo usa el CI** (job `db-migrations` de `.github/workflows/ci.yml`) para validar que las migraciones aplican desde cero en cada PR. No lo arranques en local — confunde con la DB de Supabase CLI.

---

## 7. Diagnóstico de coste

Mensualmente comprobar:

- **GCP → Billing**: alerta a 5 USD recomendada.
- **Supabase → Settings → Usage**: DB <500 MB, Storage <1 GB.
- **Cloud Run → Metrics**: instance count debe caer a 0 cuando no hay tráfico.

Si Storage de Supabase se acerca a 1 GB:

- Comprimir/redimensionar fotos en upload (`sharp` ya está en deps).
- Si no es suficiente, migrar bucket a GCS (escribir tercer adaptador en `apps/api/src/modules/files/infra/`).
