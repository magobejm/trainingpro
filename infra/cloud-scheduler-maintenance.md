# Cloud Scheduler - Maintenance Dispatch

## Endpoint
- Method: `POST`
- URL: `/maintenance/dispatch`
- Header: `x-cron-secret: <CRON_SECRET>`

## Purpose
- Ejecuta la purga TTL de chat (mensajes + adjuntos expirados).
- La operacion es idempotente; puede reintentarse sin efectos secundarios.

## Scheduler config (staging/prod)
- Region: `europe-southwest1`
- Frequency: `0 * * * *` (cada hora)
- Target: API Cloud Run service URL + `/maintenance/dispatch`
- Auth: OIDC service account or custom header secret.

## Example gcloud
```bash
gcloud scheduler jobs create http trainerpro-maintenance-dispatch \
  --schedule="0 * * * *" \
  --uri="https://<api-service-url>/maintenance/dispatch" \
  --http-method=POST \
  --headers="x-cron-secret=<CRON_SECRET>" \
  --location="europe-southwest1"
```
