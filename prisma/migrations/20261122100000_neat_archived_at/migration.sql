-- Additive: a NEAT removed from a client routine is archived, so the days the client already logged stay counted.
ALTER TABLE "plan_template_neat" ADD COLUMN "archived_at" TIMESTAMPTZ(6);
