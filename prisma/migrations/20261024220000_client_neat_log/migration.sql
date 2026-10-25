CREATE TABLE "client_neat_log" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "neat_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "value" DECIMAL(10,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "client_neat_log_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_client_neat_log" ON "client_neat_log"("client_id", "neat_id", "date");
CREATE INDEX "idx_client_neat_log_client_date" ON "client_neat_log"("client_id", "date");

ALTER TABLE "client_neat_log" ADD CONSTRAINT "client_neat_log_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client_neat_log" ADD CONSTRAINT "client_neat_log_neat_id_fkey" FOREIGN KEY ("neat_id") REFERENCES "plan_template_neat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
