-- CreateEnum
CREATE TYPE "NutritionPlanType" AS ENUM ('LIBRE', 'ESTRUCTURADO');

-- CreateTable
CREATE TABLE "meal" (
    "id" UUID NOT NULL,
    "scope" "LibraryItemScope" NOT NULL,
    "organization_id" UUID,
    "coach_membership_id" UUID,
    "name" VARCHAR(120) NOT NULL,
    "category" VARCHAR(40) NOT NULL,
    "notes" TEXT,
    "created_by" UUID,
    "updated_by" UUID,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_ingredient" (
    "id" UUID NOT NULL,
    "meal_id" UUID NOT NULL,
    "food_id" UUID NOT NULL,
    "amount_grams" DECIMAL(8,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "meal_ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_plan" (
    "id" UUID NOT NULL,
    "scope" "LibraryItemScope" NOT NULL,
    "organization_id" UUID,
    "coach_membership_id" UUID,
    "client_id" UUID,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "type" "NutritionPlanType" NOT NULL,
    "setup_data" JSONB,
    "content" JSONB,
    "strategy" VARCHAR(40),
    "created_by" UUID,
    "updated_by" UUID,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "nutrition_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_plan_checkpoint" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "plan_name" VARCHAR(120),
    "note" TEXT,
    "start_date" TIMESTAMPTZ(6),
    "end_date" TIMESTAMPTZ(6),
    "setup_data" JSONB,
    "content" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nutrition_plan_checkpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "physical_test" (
    "id" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "level" VARCHAR(80) NOT NULL,
    "objective" TEXT NOT NULL,
    "what_to_do" TEXT NOT NULL,
    "what_to_measure" TEXT NOT NULL,
    "options" JSONB,
    "norm_tables" JSONB,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "physical_test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_physical_test" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "physical_test_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" UUID,

    CONSTRAINT "client_physical_test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_physical_test_result" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "physical_test_id" UUID NOT NULL,
    "client_physical_test_id" UUID,
    "inputs_json" JSONB NOT NULL,
    "raw_score" VARCHAR(120) NOT NULL,
    "classification" VARCHAR(80) NOT NULL,
    "classification_color" VARCHAR(120),
    "measured_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by_membership_id" UUID,

    CONSTRAINT "client_physical_test_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_meal_scope_archived" ON "meal"("scope", "archived_at");

-- CreateIndex
CREATE INDEX "idx_meal_coach_archived" ON "meal"("coach_membership_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_meal_ingredient_meal_sort" ON "meal_ingredient"("meal_id", "sort_order");

-- CreateIndex
CREATE INDEX "idx_nutrition_plan_scope_archived" ON "nutrition_plan"("scope", "archived_at");

-- CreateIndex
CREATE INDEX "idx_nutrition_plan_coach_archived" ON "nutrition_plan"("coach_membership_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_nutrition_plan_client_archived" ON "nutrition_plan"("client_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_nutrition_plan_checkpoint_plan_end" ON "nutrition_plan_checkpoint"("plan_id", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "physical_test_code_key" ON "physical_test"("code");

-- CreateIndex
CREATE INDEX "idx_physical_test_category_sort" ON "physical_test"("category", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "uq_client_physical_test_client_test" ON "client_physical_test"("client_id", "physical_test_id");

-- CreateIndex
CREATE INDEX "idx_client_physical_test_client_assigned" ON "client_physical_test"("client_id", "assigned_at");

-- CreateIndex
CREATE INDEX "idx_client_physical_test_result_lookup" ON "client_physical_test_result"("client_id", "physical_test_id", "measured_at");

-- AddForeignKey
ALTER TABLE "meal" ADD CONSTRAINT "meal_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal" ADD CONSTRAINT "meal_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_ingredient" ADD CONSTRAINT "meal_ingredient_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_ingredient" ADD CONSTRAINT "meal_ingredient_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_plan" ADD CONSTRAINT "nutrition_plan_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_plan" ADD CONSTRAINT "nutrition_plan_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_plan" ADD CONSTRAINT "nutrition_plan_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_plan_checkpoint" ADD CONSTRAINT "nutrition_plan_checkpoint_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "nutrition_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_physical_test" ADD CONSTRAINT "client_physical_test_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_physical_test" ADD CONSTRAINT "client_physical_test_physical_test_id_fkey" FOREIGN KEY ("physical_test_id") REFERENCES "physical_test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_physical_test_result" ADD CONSTRAINT "client_physical_test_result_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_physical_test_result" ADD CONSTRAINT "client_physical_test_result_physical_test_id_fkey" FOREIGN KEY ("physical_test_id") REFERENCES "physical_test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_physical_test_result" ADD CONSTRAINT "client_physical_test_result_client_physical_test_id_fkey" FOREIGN KEY ("client_physical_test_id") REFERENCES "client_physical_test"("id") ON DELETE SET NULL ON UPDATE CASCADE;
