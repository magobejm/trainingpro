ALTER TABLE "organization_member"
ADD COLUMN "brand_accent" VARCHAR(20),
ADD COLUMN "brand_logo_path" VARCHAR(500);

ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_brand_accent_check"
CHECK ("brand_accent" IS NULL OR "brand_accent" IN
('blue', 'indigo', 'violet', 'teal', 'green', 'orange', 'pink', 'slate'));
