-- Additive: a warm-up copy that belongs to one client, so editing it never touches the library or another client.
ALTER TABLE "warmup_template" ADD COLUMN "owner_client_id" UUID;
CREATE INDEX "idx_warmup_template_owner_client" ON "warmup_template"("owner_client_id");
ALTER TABLE "warmup_template"
  ADD CONSTRAINT "warmup_template_owner_client_id_fkey" FOREIGN KEY ("owner_client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
