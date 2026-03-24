-- CreateTable
CREATE TABLE "plan_template_neat" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "plan_template_neat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_plan_template_neat_template" ON "plan_template_neat"("template_id");

-- AddForeignKey
ALTER TABLE "plan_template_neat" ADD CONSTRAINT "plan_template_neat_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "plan_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
