CREATE TABLE "client_weekly_load" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "week_start_date" DATE NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "client_weekly_load_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq_client_weekly_load_client_week" ON "client_weekly_load"("client_id", "week_start_date");

ALTER TABLE "client_weekly_load" ADD CONSTRAINT "client_weekly_load_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
