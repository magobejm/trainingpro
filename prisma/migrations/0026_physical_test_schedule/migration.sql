-- CreateTable
CREATE TABLE "client_physical_test_schedule" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "physical_test_id" UUID NOT NULL,
    "scheduled_date" DATE NOT NULL,
    "result_id" UUID,
    "created_by_membership_id" UUID,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "client_physical_test_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_physical_test_schedule_result_id_key" ON "client_physical_test_schedule"("result_id");

-- CreateIndex
CREATE INDEX "idx_client_physical_test_schedule_client_date" ON "client_physical_test_schedule"("client_id", "scheduled_date");

-- One active test per client and day. Archived rows stay for history.
CREATE UNIQUE INDEX "uq_client_physical_test_schedule_active_day"
ON "client_physical_test_schedule" ("client_id", "scheduled_date")
WHERE "archived_at" IS NULL;

-- AddForeignKey
ALTER TABLE "client_physical_test_schedule" ADD CONSTRAINT "client_physical_test_schedule_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_physical_test_schedule" ADD CONSTRAINT "client_physical_test_schedule_physical_test_id_fkey" FOREIGN KEY ("physical_test_id") REFERENCES "physical_test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_physical_test_schedule" ADD CONSTRAINT "client_physical_test_schedule_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "client_physical_test_result"("id") ON DELETE SET NULL ON UPDATE CASCADE;
