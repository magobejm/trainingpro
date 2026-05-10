-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COACH', 'CLIENT');

-- CreateEnum
CREATE TYPE "LibraryItemScope" AS ENUM ('GLOBAL', 'COACH');

-- CreateEnum
CREATE TYPE "TemplateKind" AS ENUM ('STRENGTH', 'CARDIO', 'ROUTINE');

-- CreateEnum
CREATE TYPE "FieldMode" AS ENUM ('HIDDEN', 'COACH_INPUT', 'CLIENT_INPUT');

-- CreateEnum
CREATE TYPE "ExerciseGroupType" AS ENUM ('CIRCUIT', 'SUPERSET');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'REVIEWED', 'CLOSED');

-- CreateEnum
CREATE TYPE "IncidentActionType" AS ENUM ('ALERTED', 'REVIEWED', 'RESPONDED', 'TAGGED', 'ADJUSTMENT_DRAFTED');

-- CreateEnum
CREATE TYPE "ChatMessageSender" AS ENUM ('COACH', 'CLIENT');

-- CreateEnum
CREATE TYPE "ChatAttachmentKind" AS ENUM ('IMAGE', 'AUDIO', 'PDF');

-- CreateEnum
CREATE TYPE "NotificationTopic" AS ENUM ('SESSION_COMPLETED', 'INCIDENT_CRITICAL', 'CLIENT_INACTIVE_3D', 'ADHERENCE_LOW_WEEKLY', 'CLIENT_REMINDER');

-- CreateTable
CREATE TABLE "organization" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_account" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "supabase_uid" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_member" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "Role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organization_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_subscription" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "client_limit" INTEGER NOT NULL DEFAULT 0,
    "active_client_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "organization_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "coach_membership_id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "avatar_url" VARCHAR(500),
    "first_name" VARCHAR(80) NOT NULL,
    "last_name" VARCHAR(80) NOT NULL,
    "objective_id" UUID NOT NULL,
    "training_plan_id" UUID,
    "notes" TEXT,
    "considerations" TEXT,
    "phone" VARCHAR(30),
    "sex" VARCHAR(30),
    "waist_cm" INTEGER,
    "hip_cm" INTEGER,
    "fc_max" INTEGER,
    "fc_rest" INTEGER,
    "fitness_level" VARCHAR(30),
    "secondary_objectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "injuries" TEXT,
    "allergies" TEXT,
    "birth_date" DATE,
    "height_cm" INTEGER,
    "weight_kg" DECIMAL(6,2),
    "created_by" UUID NOT NULL,
    "updated_by" UUID NOT NULL,
    "archived_by" UUID,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_management_section" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "client_management_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_progress_photo" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "image_url" VARCHAR(500) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "client_progress_photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_objective" (
    "id" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "client_objective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_objective" (
    "id" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "routine_objective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_muscle_group" (
    "id" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "exercise_muscle_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cardio_method_type" (
    "id" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cardio_method_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_equipment" (
    "id" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "exercise_equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plio_type" (
    "id" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plio_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobility_type" (
    "id" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "mobility_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "isometric_type" (
    "id" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "isometric_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "isometric_exercise" (
    "id" UUID NOT NULL,
    "scope" "LibraryItemScope" NOT NULL,
    "organization_id" UUID,
    "coach_membership_id" UUID,
    "name" VARCHAR(120) NOT NULL,
    "isometric_type_id" UUID,
    "isometric_type" VARCHAR(30),
    "equipment_id" UUID,
    "equipment" VARCHAR(120),
    "movement_pattern_id" UUID,
    "anatomical_plane_id" UUID,
    "description" TEXT,
    "coach_instructions" TEXT,
    "notes" TEXT,
    "youtube_url" VARCHAR(500),
    "media_url" VARCHAR(500),
    "media_type" VARCHAR(40),
    "created_by" UUID,
    "updated_by" UUID,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "isometric_exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sport_type" (
    "id" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sport_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movement_pattern" (
    "id" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "movement_pattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anatomical_plane" (
    "id" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "label" VARCHAR(120) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "anatomical_plane_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_muscle_group_assignment" (
    "exercise_id" UUID NOT NULL,
    "muscle_group_id" UUID NOT NULL,

    CONSTRAINT "exercise_muscle_group_assignment_pkey" PRIMARY KEY ("exercise_id","muscle_group_id")
);

-- CreateTable
CREATE TABLE "exercise" (
    "id" UUID NOT NULL,
    "scope" "LibraryItemScope" NOT NULL,
    "organization_id" UUID,
    "coach_membership_id" UUID,
    "name" VARCHAR(120) NOT NULL,
    "equipment_id" UUID,
    "equipment" VARCHAR(80),
    "instructions" TEXT,
    "coach_instructions" TEXT,
    "media_url" VARCHAR(500),
    "media_type" VARCHAR(40),
    "youtube_url" VARCHAR(500),
    "movement_pattern_id" UUID,
    "anatomical_plane_id" UUID,
    "created_by" UUID,
    "updated_by" UUID,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cardio_method" (
    "id" UUID NOT NULL,
    "scope" "LibraryItemScope" NOT NULL,
    "organization_id" UUID,
    "coach_membership_id" UUID,
    "name" VARCHAR(120) NOT NULL,
    "method_type_id" UUID NOT NULL,
    "equipment_id" UUID,
    "description" TEXT,
    "coach_instructions" TEXT,
    "equipment" VARCHAR(120),
    "media_url" VARCHAR(500),
    "media_type" VARCHAR(40),
    "youtube_url" VARCHAR(500),
    "created_by" UUID,
    "updated_by" UUID,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "movement_pattern_id" UUID,
    "anatomical_plane_id" UUID,

    CONSTRAINT "cardio_method_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food" (
    "id" UUID NOT NULL,
    "scope" "LibraryItemScope" NOT NULL,
    "organization_id" UUID,
    "coach_membership_id" UUID,
    "name" VARCHAR(120) NOT NULL,
    "serving_unit" VARCHAR(40),
    "food_type" VARCHAR(40),
    "food_category" VARCHAR(80),
    "calories_kcal" INTEGER,
    "protein_g" INTEGER,
    "carbs_g" INTEGER,
    "fat_g" INTEGER,
    "notes" TEXT,
    "media_url" VARCHAR(500),
    "media_type" VARCHAR(40),
    "created_by" UUID,
    "updated_by" UUID,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plio_exercise" (
    "id" UUID NOT NULL,
    "scope" "LibraryItemScope" NOT NULL DEFAULT 'GLOBAL',
    "organization_id" UUID,
    "coach_membership_id" UUID,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "coach_instructions" TEXT,
    "plio_type_id" UUID,
    "equipment_id" UUID,
    "equipment" VARCHAR(120),
    "plio_type" VARCHAR(30),
    "movement_pattern_id" UUID,
    "anatomical_plane_id" UUID,
    "notes" TEXT,
    "youtube_url" VARCHAR(500),
    "media_url" VARCHAR(500),
    "media_type" VARCHAR(40),
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plio_exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobility_exercise" (
    "id" UUID NOT NULL,
    "scope" "LibraryItemScope" NOT NULL DEFAULT 'GLOBAL',
    "organization_id" UUID,
    "coach_membership_id" UUID,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "coach_instructions" TEXT,
    "mobility_type_id" UUID,
    "mobility_type" VARCHAR(30),
    "movement_pattern_id" UUID,
    "anatomical_plane_id" UUID,
    "youtube_url" VARCHAR(500),
    "media_url" VARCHAR(500),
    "media_type" VARCHAR(40),
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "equipment_id" UUID,

    CONSTRAINT "mobility_exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sport" (
    "id" UUID NOT NULL,
    "scope" "LibraryItemScope" NOT NULL DEFAULT 'GLOBAL',
    "organization_id" UUID,
    "coach_membership_id" UUID,
    "name" VARCHAR(120) NOT NULL,
    "icon" VARCHAR(10) NOT NULL,
    "sport_type_id" UUID,
    "description" TEXT,
    "coach_instructions" TEXT,
    "movement_pattern_id" UUID,
    "anatomical_plane_id" UUID,
    "media_url" VARCHAR(500),
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "equipment_id" UUID,

    CONSTRAINT "sport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_template" (
    "id" UUID NOT NULL,
    "scope" "LibraryItemScope" NOT NULL DEFAULT 'COACH',
    "organization_id" UUID,
    "coach_membership_id" UUID,
    "kind" "TemplateKind" NOT NULL DEFAULT 'STRENGTH',
    "name" VARCHAR(120) NOT NULL,
    "expected_completion_days" INTEGER,
    "template_version" INTEGER NOT NULL DEFAULT 1,
    "archived_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plan_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_template_neat" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "plan_template_neat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_template_objective" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "objective_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_template_objective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warmup_template_group" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "group_type" VARCHAR(20) NOT NULL,
    "note" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "warmup_template_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warmup_template" (
    "id" UUID NOT NULL,
    "scope" "LibraryItemScope" NOT NULL DEFAULT 'COACH',
    "organization_id" UUID,
    "coach_membership_id" UUID,
    "name" VARCHAR(120) NOT NULL,
    "template_version" INTEGER NOT NULL DEFAULT 1,
    "archived_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "warmup_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warmup_template_item" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "block_type" VARCHAR(20) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "display_name" VARCHAR(120) NOT NULL,
    "exercise_library_id" UUID,
    "cardio_method_library_id" UUID,
    "plio_exercise_library_id" UUID,
    "mobility_exercise_library_id" UUID,
    "isometric_exercise_library_id" UUID,
    "sport_library_id" UUID,
    "group_id" UUID,
    "sets_planned" INTEGER,
    "reps_min" INTEGER,
    "reps_max" INTEGER,
    "rounds_planned" INTEGER,
    "work_seconds" INTEGER,
    "rest_seconds" INTEGER,
    "target_rpe" INTEGER,
    "target_rir" INTEGER,
    "duration_minutes" INTEGER,
    "notes" TEXT,
    "metadata_json" JSONB,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "warmup_template_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_day" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "day_index" INTEGER NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "notes" TEXT,
    "notes_title" VARCHAR(120),
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plan_day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_day_warmup" (
    "id" UUID NOT NULL,
    "plan_day_id" UUID NOT NULL,
    "warmup_template_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "plan_day_warmup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_strength_exercise" (
    "id" UUID NOT NULL,
    "day_id" UUID NOT NULL,
    "group_id" UUID,
    "exercise_library_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "display_name" VARCHAR(120) NOT NULL,
    "sets_planned" INTEGER,
    "reps_min" INTEGER,
    "reps_max" INTEGER,
    "weight_range_min_kg" DECIMAL(6,2),
    "weight_range_max_kg" DECIMAL(6,2),
    "per_set_weight_ranges_json" JSONB,
    "target_rpe" INTEGER,
    "target_rir" INTEGER,
    "rest_seconds" INTEGER DEFAULT 0,
    "locked_fields_json" JSONB,
    "notes" TEXT,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plan_strength_exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_mode" (
    "id" UUID NOT NULL,
    "plan_strength_exercise_id" UUID NOT NULL,
    "field_key" VARCHAR(80) NOT NULL,
    "mode" "FieldMode" NOT NULL DEFAULT 'COACH_INPUT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "field_mode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_cardio_block" (
    "id" UUID NOT NULL,
    "day_id" UUID NOT NULL,
    "group_id" UUID,
    "cardio_method_library_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "display_name" VARCHAR(120) NOT NULL,
    "rounds_planned" INTEGER NOT NULL DEFAULT 1,
    "work_seconds" INTEGER NOT NULL,
    "rest_seconds" INTEGER NOT NULL DEFAULT 0,
    "target_distance_meters" INTEGER,
    "target_rpe" INTEGER,
    "locked_fields_json" JSONB,
    "notes" TEXT,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plan_cardio_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cardio_field_mode" (
    "id" UUID NOT NULL,
    "plan_cardio_block_id" UUID NOT NULL,
    "field_key" VARCHAR(80) NOT NULL,
    "mode" "FieldMode" NOT NULL DEFAULT 'COACH_INPUT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cardio_field_mode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_plio_block" (
    "id" UUID NOT NULL,
    "day_id" UUID NOT NULL,
    "group_id" UUID,
    "plio_exercise_library_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "display_name" VARCHAR(120) NOT NULL,
    "rounds_planned" INTEGER NOT NULL DEFAULT 1,
    "work_seconds" INTEGER NOT NULL,
    "rest_seconds" INTEGER NOT NULL DEFAULT 0,
    "target_rpe" INTEGER,
    "locked_fields_json" JSONB,
    "notes" TEXT,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plan_plio_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plio_field_mode" (
    "id" UUID NOT NULL,
    "plan_plio_block_id" UUID NOT NULL,
    "field_key" VARCHAR(80) NOT NULL,
    "mode" "FieldMode" NOT NULL DEFAULT 'COACH_INPUT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plio_field_mode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_mobility_block" (
    "id" UUID NOT NULL,
    "day_id" UUID NOT NULL,
    "group_id" UUID,
    "mobility_exercise_library_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "display_name" VARCHAR(120) NOT NULL,
    "rounds_planned" INTEGER NOT NULL DEFAULT 1,
    "work_seconds" INTEGER NOT NULL,
    "rest_seconds" INTEGER NOT NULL DEFAULT 0,
    "target_rpe" INTEGER,
    "locked_fields_json" JSONB,
    "notes" TEXT,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plan_mobility_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobility_field_mode" (
    "id" UUID NOT NULL,
    "plan_mobility_block_id" UUID NOT NULL,
    "field_key" VARCHAR(80) NOT NULL,
    "mode" "FieldMode" NOT NULL DEFAULT 'COACH_INPUT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "mobility_field_mode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_sport_block" (
    "id" UUID NOT NULL,
    "day_id" UUID NOT NULL,
    "group_id" UUID,
    "sport_library_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "display_name" VARCHAR(120) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "target_rpe" INTEGER,
    "locked_fields_json" JSONB,
    "notes" TEXT,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plan_sport_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sport_field_mode" (
    "id" UUID NOT NULL,
    "plan_sport_block_id" UUID NOT NULL,
    "field_key" VARCHAR(80) NOT NULL,
    "mode" "FieldMode" NOT NULL DEFAULT 'COACH_INPUT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sport_field_mode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_exercise_group" (
    "id" UUID NOT NULL,
    "day_id" UUID NOT NULL,
    "client_id" VARCHAR(40),
    "group_type" "ExerciseGroupType" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plan_exercise_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_isometric_block" (
    "id" UUID NOT NULL,
    "day_id" UUID NOT NULL,
    "group_id" UUID,
    "isometric_exercise_library_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "display_name" VARCHAR(120) NOT NULL,
    "target_rpe" INTEGER,
    "sets_planned" INTEGER,
    "locked_fields_json" JSONB,
    "notes" TEXT,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plan_isometric_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "isometric_field_mode" (
    "id" UUID NOT NULL,
    "plan_isometric_block_id" UUID NOT NULL,
    "field_key" VARCHAR(80) NOT NULL,
    "mode" "FieldMode" NOT NULL DEFAULT 'COACH_INPUT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "isometric_field_mode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_strength_set" (
    "id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "set_index" INTEGER NOT NULL,
    "reps" INTEGER,
    "rpe" INTEGER,
    "weight_kg" DECIMAL(6,2),
    "rir" INTEGER,
    "rest_seconds" INTEGER,
    "advanced_technique" VARCHAR(40),
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plan_strength_set_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_cardio_set" (
    "id" UUID NOT NULL,
    "block_id" UUID NOT NULL,
    "set_index" INTEGER NOT NULL,
    "fc_max_pct" INTEGER,
    "fc_reserve_pct" INTEGER,
    "heart_rate" INTEGER,
    "rpe" INTEGER,
    "advanced_technique" VARCHAR(40),
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plan_cardio_set_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_plio_set" (
    "id" UUID NOT NULL,
    "block_id" UUID NOT NULL,
    "set_index" INTEGER NOT NULL,
    "reps" INTEGER,
    "rpe" INTEGER,
    "weight_kg" DECIMAL(6,2),
    "rest_seconds" INTEGER,
    "advanced_technique" VARCHAR(40),
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plan_plio_set_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_isometric_set" (
    "id" UUID NOT NULL,
    "block_id" UUID NOT NULL,
    "set_index" INTEGER NOT NULL,
    "rpe" INTEGER,
    "duration_seconds" INTEGER,
    "weight_kg" DECIMAL(6,2),
    "rest_seconds" INTEGER,
    "advanced_technique" VARCHAR(40),
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plan_isometric_set_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_mobility_set" (
    "id" UUID NOT NULL,
    "block_id" UUID NOT NULL,
    "set_index" INTEGER NOT NULL,
    "reps" INTEGER,
    "rpe" INTEGER,
    "rom" VARCHAR(30),
    "rest_seconds" INTEGER,
    "advanced_technique" VARCHAR(40),
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plan_mobility_set_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_sport_set" (
    "id" UUID NOT NULL,
    "block_id" UUID NOT NULL,
    "set_index" INTEGER NOT NULL,
    "reps" INTEGER,
    "rpe" INTEGER,
    "rir" INTEGER,
    "weight_kg" DECIMAL(6,2),
    "fc_max_pct" INTEGER,
    "fc_reserve_pct" INTEGER,
    "heart_rate" INTEGER,
    "rest_seconds" INTEGER,
    "advanced_technique" VARCHAR(40),
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plan_sport_set_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_instance" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "coach_membership_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "source_template_id" UUID NOT NULL,
    "source_template_version" INTEGER NOT NULL,
    "session_date" DATE NOT NULL,
    "started_at" TIMESTAMPTZ(6),
    "finished_at" TIMESTAMPTZ(6),
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "is_incomplete" BOOLEAN NOT NULL DEFAULT false,
    "finish_comment" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'PENDING',
    "archived_at" TIMESTAMPTZ(6),
    "created_by" UUID NOT NULL,
    "updated_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "plan_day_id" UUID,
    "plan_day_index" INTEGER,
    "plan_day_title" VARCHAR(120),

    CONSTRAINT "session_instance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_strength_item" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "source_exercise_id" UUID,
    "display_name" VARCHAR(120) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "sets_planned" INTEGER,
    "reps_min" INTEGER,
    "reps_max" INTEGER,
    "weight_range_min_kg" DECIMAL(6,2),
    "weight_range_max_kg" DECIMAL(6,2),
    "per_set_ranges_json" JSONB,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "session_strength_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "set_log" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "session_item_id" UUID NOT NULL,
    "set_index" INTEGER NOT NULL,
    "reps_done" INTEGER,
    "weight_done_kg" DECIMAL(6,2),
    "effort_rpe" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "set_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_cardio_block" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "source_cardio_block_id" UUID,
    "source_cardio_method_id" UUID,
    "display_name" VARCHAR(120) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "rounds_planned" INTEGER NOT NULL DEFAULT 1,
    "work_seconds" INTEGER NOT NULL,
    "rest_seconds" INTEGER NOT NULL DEFAULT 0,
    "target_distance_meters" INTEGER,
    "target_rpe" INTEGER,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "session_cardio_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interval_log" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "session_cardio_block_id" UUID NOT NULL,
    "interval_index" INTEGER NOT NULL,
    "distance_done_meters" INTEGER,
    "duration_seconds_done" INTEGER,
    "effort_rpe" INTEGER,
    "avg_heart_rate" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "interval_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_plio_block" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "source_plio_exercise_id" UUID,
    "display_name" VARCHAR(120) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "rounds_planned" INTEGER NOT NULL DEFAULT 1,
    "work_seconds" INTEGER NOT NULL,
    "rest_seconds" INTEGER NOT NULL DEFAULT 0,
    "target_rpe" INTEGER,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "session_plio_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plio_set_log" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "session_plio_block_id" UUID NOT NULL,
    "set_index" INTEGER NOT NULL,
    "reps_done" INTEGER,
    "weight_done_kg" DECIMAL(6,2),
    "effort_rpe" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plio_set_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_mobility_block" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "source_mobility_exercise_id" UUID,
    "display_name" VARCHAR(120) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "rounds_planned" INTEGER NOT NULL DEFAULT 1,
    "work_seconds" INTEGER NOT NULL,
    "rest_seconds" INTEGER NOT NULL DEFAULT 0,
    "target_rpe" INTEGER,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "session_mobility_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mobility_set_log" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "session_mobility_block_id" UUID NOT NULL,
    "set_index" INTEGER NOT NULL,
    "reps_done" INTEGER,
    "rom_done" VARCHAR(30),
    "effort_rpe" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "mobility_set_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_isometric_block" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "source_isometric_exercise_id" UUID,
    "display_name" VARCHAR(120) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "sets_planned" INTEGER,
    "target_rpe" INTEGER,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "session_isometric_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "isometric_set_log" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "session_isometric_block_id" UUID NOT NULL,
    "set_index" INTEGER NOT NULL,
    "duration_seconds_done" INTEGER,
    "weight_done_kg" DECIMAL(6,2),
    "effort_rpe" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "isometric_set_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_sport_block" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "source_sport_id" UUID,
    "display_name" VARCHAR(120) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "duration_minutes" INTEGER NOT NULL,
    "target_rpe" INTEGER,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "session_sport_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sport_session_log" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "session_sport_block_id" UUID NOT NULL,
    "duration_minutes_done" INTEGER,
    "effort_rpe" INTEGER,
    "avg_heart_rate" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sport_session_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "coach_membership_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "session_id" UUID,
    "session_item_id" UUID,
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "tag" VARCHAR(60),
    "coach_response" TEXT,
    "adjustment_draft" TEXT,
    "coach_alerted_at" TIMESTAMPTZ(6),
    "reviewed_at" TIMESTAMPTZ(6),
    "archived_at" TIMESTAMPTZ(6),
    "created_by" UUID NOT NULL,
    "updated_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_action" (
    "id" UUID NOT NULL,
    "incident_id" UUID NOT NULL,
    "action_type" "IncidentActionType" NOT NULL,
    "payload_json" JSONB,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_note" (
    "id" UUID NOT NULL,
    "coach_membership_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "client_id" UUID,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "archived_at" TIMESTAMPTZ(6),

    CONSTRAINT "coach_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_report" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "coach_membership_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "week_start_date" DATE NOT NULL,
    "report_date" DATE NOT NULL,
    "source_session_id" UUID,
    "mood" INTEGER,
    "energy" INTEGER,
    "sleep_hours" DECIMAL(4,2),
    "adherence_percent" INTEGER,
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "updated_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "weekly_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_thread" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "coach_membership_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "chat_thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_message" (
    "id" UUID NOT NULL,
    "thread_id" UUID NOT NULL,
    "sender_role" "ChatMessageSender" NOT NULL,
    "sender_subject" VARCHAR(120) NOT NULL,
    "text" VARCHAR(2000),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "chat_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_attachment" (
    "id" UUID NOT NULL,
    "message_id" UUID NOT NULL,
    "kind" "ChatAttachmentKind" NOT NULL,
    "file_name" VARCHAR(160) NOT NULL,
    "mime_type" VARCHAR(120) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_path" VARCHAR(500) NOT NULL,
    "public_url" VARCHAR(500),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_device_token" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "membership_id" UUID,
    "role" "Role" NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "platform" VARCHAR(30) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_seen_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notification_device_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preference" (
    "id" UUID NOT NULL,
    "coach_membership_id" UUID NOT NULL,
    "topic" "NotificationTopic" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notification_preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_event_log" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "coach_membership_id" UUID,
    "client_id" UUID,
    "topic" "NotificationTopic" NOT NULL,
    "dedupe_key" VARCHAR(180),
    "payload_json" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_event_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_event" (
    "id" UUID NOT NULL,
    "coach_membership_id" UUID NOT NULL,
    "client_id" UUID,
    "type" VARCHAR(20) NOT NULL,
    "date" DATE NOT NULL,
    "title" VARCHAR(200),
    "content" TEXT,
    "time" VARCHAR(5),
    "color" VARCHAR(30),
    "plan_day_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "archived_at" TIMESTAMPTZ(6),

    CONSTRAINT "calendar_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_account_email_key" ON "user_account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_account_supabase_uid_key" ON "user_account"("supabase_uid");

-- CreateIndex
CREATE INDEX "idx_org_member_org_role" ON "organization_member"("organization_id", "role");

-- CreateIndex
CREATE INDEX "idx_org_member_user" ON "organization_member"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_org_user_role" ON "organization_member"("organization_id", "user_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "organization_subscription_organization_id_key" ON "organization_subscription"("organization_id");

-- CreateIndex
CREATE INDEX "idx_client_org_archived" ON "client"("organization_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_client_coach_archived" ON "client"("coach_membership_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_client_objective" ON "client"("objective_id");

-- CreateIndex
CREATE INDEX "idx_client_training_plan" ON "client"("training_plan_id");

-- CreateIndex
CREATE INDEX "idx_client_email" ON "client"("email");

-- CreateIndex
CREATE INDEX "idx_client_management_section_lookup" ON "client_management_section"("client_id", "archived", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "uq_client_management_section_client_code" ON "client_management_section"("client_id", "code");

-- CreateIndex
CREATE INDEX "idx_client_progress_photo_client_archived_created" ON "client_progress_photo"("client_id", "archived", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "client_objective_code_key" ON "client_objective"("code");

-- CreateIndex
CREATE UNIQUE INDEX "client_objective_label_key" ON "client_objective"("label");

-- CreateIndex
CREATE INDEX "idx_client_objective_sort" ON "client_objective"("sort_order");

-- CreateIndex
CREATE INDEX "idx_client_objective_default" ON "client_objective"("is_default");

-- CreateIndex
CREATE UNIQUE INDEX "routine_objective_code_key" ON "routine_objective"("code");

-- CreateIndex
CREATE UNIQUE INDEX "routine_objective_label_key" ON "routine_objective"("label");

-- CreateIndex
CREATE INDEX "idx_routine_objective_sort" ON "routine_objective"("sort_order");

-- CreateIndex
CREATE INDEX "idx_routine_objective_default" ON "routine_objective"("is_default");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_muscle_group_code_key" ON "exercise_muscle_group"("code");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_muscle_group_label_key" ON "exercise_muscle_group"("label");

-- CreateIndex
CREATE INDEX "idx_exercise_muscle_group_sort" ON "exercise_muscle_group"("sort_order");

-- CreateIndex
CREATE INDEX "idx_exercise_muscle_group_default" ON "exercise_muscle_group"("is_default");

-- CreateIndex
CREATE UNIQUE INDEX "cardio_method_type_code_key" ON "cardio_method_type"("code");

-- CreateIndex
CREATE UNIQUE INDEX "cardio_method_type_label_key" ON "cardio_method_type"("label");

-- CreateIndex
CREATE INDEX "idx_cardio_method_type_sort" ON "cardio_method_type"("sort_order");

-- CreateIndex
CREATE INDEX "idx_cardio_method_type_default" ON "cardio_method_type"("is_default");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_equipment_code_key" ON "exercise_equipment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_equipment_label_key" ON "exercise_equipment"("label");

-- CreateIndex
CREATE INDEX "idx_exercise_equipment_sort" ON "exercise_equipment"("sort_order");

-- CreateIndex
CREATE INDEX "idx_exercise_equipment_default" ON "exercise_equipment"("is_default");

-- CreateIndex
CREATE UNIQUE INDEX "plio_type_code_key" ON "plio_type"("code");

-- CreateIndex
CREATE UNIQUE INDEX "plio_type_label_key" ON "plio_type"("label");

-- CreateIndex
CREATE INDEX "idx_plio_type_sort" ON "plio_type"("sort_order");

-- CreateIndex
CREATE INDEX "idx_plio_type_default" ON "plio_type"("is_default");

-- CreateIndex
CREATE UNIQUE INDEX "mobility_type_code_key" ON "mobility_type"("code");

-- CreateIndex
CREATE UNIQUE INDEX "mobility_type_label_key" ON "mobility_type"("label");

-- CreateIndex
CREATE INDEX "idx_mobility_type_sort" ON "mobility_type"("sort_order");

-- CreateIndex
CREATE INDEX "idx_mobility_type_default" ON "mobility_type"("is_default");

-- CreateIndex
CREATE UNIQUE INDEX "isometric_type_code_key" ON "isometric_type"("code");

-- CreateIndex
CREATE UNIQUE INDEX "isometric_type_label_key" ON "isometric_type"("label");

-- CreateIndex
CREATE INDEX "idx_isometric_type_sort" ON "isometric_type"("sort_order");

-- CreateIndex
CREATE INDEX "idx_isometric_type_default" ON "isometric_type"("is_default");

-- CreateIndex
CREATE INDEX "idx_isometric_scope_archived" ON "isometric_exercise"("scope", "archived_at");

-- CreateIndex
CREATE INDEX "idx_isometric_coach_archived" ON "isometric_exercise"("coach_membership_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_isometric_type_fk" ON "isometric_exercise"("isometric_type_id");

-- CreateIndex
CREATE INDEX "idx_isometric_equipment" ON "isometric_exercise"("equipment_id");

-- CreateIndex
CREATE INDEX "idx_isometric_movement_pattern" ON "isometric_exercise"("movement_pattern_id");

-- CreateIndex
CREATE INDEX "idx_isometric_anatomical_plane" ON "isometric_exercise"("anatomical_plane_id");

-- CreateIndex
CREATE UNIQUE INDEX "sport_type_code_key" ON "sport_type"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sport_type_label_key" ON "sport_type"("label");

-- CreateIndex
CREATE INDEX "idx_sport_type_sort" ON "sport_type"("sort_order");

-- CreateIndex
CREATE INDEX "idx_sport_type_default" ON "sport_type"("is_default");

-- CreateIndex
CREATE UNIQUE INDEX "movement_pattern_code_key" ON "movement_pattern"("code");

-- CreateIndex
CREATE UNIQUE INDEX "movement_pattern_label_key" ON "movement_pattern"("label");

-- CreateIndex
CREATE INDEX "idx_movement_pattern_sort" ON "movement_pattern"("sort_order");

-- CreateIndex
CREATE INDEX "idx_movement_pattern_default" ON "movement_pattern"("is_default");

-- CreateIndex
CREATE UNIQUE INDEX "anatomical_plane_code_key" ON "anatomical_plane"("code");

-- CreateIndex
CREATE UNIQUE INDEX "anatomical_plane_label_key" ON "anatomical_plane"("label");

-- CreateIndex
CREATE INDEX "idx_anatomical_plane_sort" ON "anatomical_plane"("sort_order");

-- CreateIndex
CREATE INDEX "idx_anatomical_plane_default" ON "anatomical_plane"("is_default");

-- CreateIndex
CREATE INDEX "idx_emga_muscle_group" ON "exercise_muscle_group_assignment"("muscle_group_id");

-- CreateIndex
CREATE INDEX "idx_exercise_scope_archived" ON "exercise"("scope", "archived_at");

-- CreateIndex
CREATE INDEX "idx_exercise_coach_archived" ON "exercise"("coach_membership_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_exercise_equipment" ON "exercise"("equipment_id");

-- CreateIndex
CREATE INDEX "idx_exercise_movement_pattern" ON "exercise"("movement_pattern_id");

-- CreateIndex
CREATE INDEX "idx_exercise_anatomical_plane" ON "exercise"("anatomical_plane_id");

-- CreateIndex
CREATE INDEX "idx_cardio_scope_archived" ON "cardio_method"("scope", "archived_at");

-- CreateIndex
CREATE INDEX "idx_cardio_coach_archived" ON "cardio_method"("coach_membership_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_cardio_method_type" ON "cardio_method"("method_type_id");

-- CreateIndex
CREATE INDEX "idx_cardio_equipment" ON "cardio_method"("equipment_id");

-- CreateIndex
CREATE INDEX "idx_cardio_movement_pattern" ON "cardio_method"("movement_pattern_id");

-- CreateIndex
CREATE INDEX "idx_cardio_anatomical_plane" ON "cardio_method"("anatomical_plane_id");

-- CreateIndex
CREATE INDEX "idx_food_scope_archived" ON "food"("scope", "archived_at");

-- CreateIndex
CREATE INDEX "idx_food_coach_archived" ON "food"("coach_membership_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_plio_scope_archived" ON "plio_exercise"("scope", "archived_at");

-- CreateIndex
CREATE INDEX "idx_plio_coach_archived" ON "plio_exercise"("coach_membership_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_plio_type" ON "plio_exercise"("plio_type_id");

-- CreateIndex
CREATE INDEX "idx_plio_equipment" ON "plio_exercise"("equipment_id");

-- CreateIndex
CREATE INDEX "idx_plio_movement_pattern" ON "plio_exercise"("movement_pattern_id");

-- CreateIndex
CREATE INDEX "idx_plio_anatomical_plane" ON "plio_exercise"("anatomical_plane_id");

-- CreateIndex
CREATE INDEX "idx_mobility_scope_archived" ON "mobility_exercise"("scope", "archived_at");

-- CreateIndex
CREATE INDEX "idx_mobility_coach_archived" ON "mobility_exercise"("coach_membership_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_mobility_type" ON "mobility_exercise"("mobility_type_id");

-- CreateIndex
CREATE INDEX "idx_mobility_movement_pattern" ON "mobility_exercise"("movement_pattern_id");

-- CreateIndex
CREATE INDEX "idx_mobility_anatomical_plane" ON "mobility_exercise"("anatomical_plane_id");

-- CreateIndex
CREATE INDEX "idx_mobility_equipment" ON "mobility_exercise"("equipment_id");

-- CreateIndex
CREATE INDEX "idx_sport_scope_archived" ON "sport"("scope", "archived_at");

-- CreateIndex
CREATE INDEX "idx_sport_coach_archived" ON "sport"("coach_membership_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_sport_type" ON "sport"("sport_type_id");

-- CreateIndex
CREATE INDEX "idx_sport_movement_pattern" ON "sport"("movement_pattern_id");

-- CreateIndex
CREATE INDEX "idx_sport_anatomical_plane" ON "sport"("anatomical_plane_id");

-- CreateIndex
CREATE INDEX "idx_sport_equipment" ON "sport"("equipment_id");

-- CreateIndex
CREATE INDEX "idx_plan_template_scope_archived" ON "plan_template"("scope", "archived_at");

-- CreateIndex
CREATE INDEX "idx_plan_template_coach_archived" ON "plan_template"("coach_membership_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_plan_template_org_archived" ON "plan_template"("organization_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_plan_template_neat_template" ON "plan_template_neat"("template_id");

-- CreateIndex
CREATE INDEX "idx_plan_template_objective_template" ON "plan_template_objective"("template_id");

-- CreateIndex
CREATE INDEX "idx_plan_template_objective_objective" ON "plan_template_objective"("objective_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_plan_template_objective" ON "plan_template_objective"("template_id", "objective_id");

-- CreateIndex
CREATE INDEX "idx_warmup_template_group_template" ON "warmup_template_group"("template_id");

-- CreateIndex
CREATE INDEX "idx_warmup_template_scope_archived" ON "warmup_template"("scope", "archived_at");

-- CreateIndex
CREATE INDEX "idx_warmup_template_coach_archived" ON "warmup_template"("coach_membership_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_warmup_template_org_archived" ON "warmup_template"("organization_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_warmup_template_item_template_archived" ON "warmup_template_item"("template_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_plan_day_template_archived" ON "plan_day"("template_id", "archived_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_plan_day_template_index" ON "plan_day"("template_id", "day_index");

-- CreateIndex
CREATE INDEX "idx_plan_day_warmup_day" ON "plan_day_warmup"("plan_day_id");

-- CreateIndex
CREATE INDEX "idx_plan_strength_day_archived" ON "plan_strength_exercise"("day_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_plan_strength_group" ON "plan_strength_exercise"("group_id");

-- CreateIndex
CREATE INDEX "idx_field_mode_item" ON "field_mode"("plan_strength_exercise_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_field_mode_item_field" ON "field_mode"("plan_strength_exercise_id", "field_key");

-- CreateIndex
CREATE INDEX "idx_plan_cardio_day_archived" ON "plan_cardio_block"("day_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_plan_cardio_group" ON "plan_cardio_block"("group_id");

-- CreateIndex
CREATE INDEX "idx_cardio_field_mode_item" ON "cardio_field_mode"("plan_cardio_block_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_cardio_field_mode_item_field" ON "cardio_field_mode"("plan_cardio_block_id", "field_key");

-- CreateIndex
CREATE INDEX "idx_plan_plio_day_archived" ON "plan_plio_block"("day_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_plan_plio_group" ON "plan_plio_block"("group_id");

-- CreateIndex
CREATE INDEX "idx_plio_field_mode_item" ON "plio_field_mode"("plan_plio_block_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_plio_field_mode_item_field" ON "plio_field_mode"("plan_plio_block_id", "field_key");

-- CreateIndex
CREATE INDEX "idx_plan_mobility_day_archived" ON "plan_mobility_block"("day_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_plan_mobility_group" ON "plan_mobility_block"("group_id");

-- CreateIndex
CREATE INDEX "idx_mobility_field_mode_item" ON "mobility_field_mode"("plan_mobility_block_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_mobility_field_mode_item_field" ON "mobility_field_mode"("plan_mobility_block_id", "field_key");

-- CreateIndex
CREATE INDEX "idx_plan_sport_day_archived" ON "plan_sport_block"("day_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_plan_sport_group" ON "plan_sport_block"("group_id");

-- CreateIndex
CREATE INDEX "idx_sport_field_mode_item" ON "sport_field_mode"("plan_sport_block_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_sport_field_mode_item_field" ON "sport_field_mode"("plan_sport_block_id", "field_key");

-- CreateIndex
CREATE INDEX "idx_plan_exercise_group_day" ON "plan_exercise_group"("day_id");

-- CreateIndex
CREATE INDEX "idx_plan_isometric_day_archived" ON "plan_isometric_block"("day_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_plan_isometric_group" ON "plan_isometric_block"("group_id");

-- CreateIndex
CREATE INDEX "idx_isometric_field_mode_item" ON "isometric_field_mode"("plan_isometric_block_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_isometric_field_mode_item_field" ON "isometric_field_mode"("plan_isometric_block_id", "field_key");

-- CreateIndex
CREATE INDEX "idx_plan_strength_set_exercise" ON "plan_strength_set"("exercise_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_plan_strength_set" ON "plan_strength_set"("exercise_id", "set_index");

-- CreateIndex
CREATE INDEX "idx_plan_cardio_set_block" ON "plan_cardio_set"("block_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_plan_cardio_set" ON "plan_cardio_set"("block_id", "set_index");

-- CreateIndex
CREATE INDEX "idx_plan_plio_set_block" ON "plan_plio_set"("block_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_plan_plio_set" ON "plan_plio_set"("block_id", "set_index");

-- CreateIndex
CREATE INDEX "idx_plan_isometric_set_block" ON "plan_isometric_set"("block_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_plan_isometric_set" ON "plan_isometric_set"("block_id", "set_index");

-- CreateIndex
CREATE INDEX "idx_plan_mobility_set_block" ON "plan_mobility_set"("block_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_plan_mobility_set" ON "plan_mobility_set"("block_id", "set_index");

-- CreateIndex
CREATE INDEX "idx_plan_sport_set_block" ON "plan_sport_set"("block_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_plan_sport_set" ON "plan_sport_set"("block_id", "set_index");

-- CreateIndex
CREATE INDEX "idx_session_coach_date" ON "session_instance"("coach_membership_id", "session_date");

-- CreateIndex
CREATE INDEX "idx_session_org_date" ON "session_instance"("organization_id", "session_date");

-- CreateIndex
CREATE UNIQUE INDEX "uq_session_client_date" ON "session_instance"("client_id", "session_date");

-- CreateIndex
CREATE INDEX "idx_session_item_session_archived" ON "session_strength_item"("session_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_set_log_session" ON "set_log"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_set_log_item_set" ON "set_log"("session_item_id", "set_index");

-- CreateIndex
CREATE INDEX "idx_session_cardio_session_archived" ON "session_cardio_block"("session_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_interval_log_session" ON "interval_log"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_interval_log_block_interval" ON "interval_log"("session_cardio_block_id", "interval_index");

-- CreateIndex
CREATE INDEX "idx_session_plio_session_archived" ON "session_plio_block"("session_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_plio_log_session" ON "plio_set_log"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_plio_log_block_set" ON "plio_set_log"("session_plio_block_id", "set_index");

-- CreateIndex
CREATE INDEX "idx_session_mobility_session_archived" ON "session_mobility_block"("session_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_mobility_log_session" ON "mobility_set_log"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_mobility_log_block_set" ON "mobility_set_log"("session_mobility_block_id", "set_index");

-- CreateIndex
CREATE INDEX "idx_session_isometric_session_archived" ON "session_isometric_block"("session_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_isometric_log_session" ON "isometric_set_log"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_isometric_log_block_set" ON "isometric_set_log"("session_isometric_block_id", "set_index");

-- CreateIndex
CREATE INDEX "idx_session_sport_session_archived" ON "session_sport_block"("session_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_sport_log_session" ON "sport_session_log"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_sport_log_block" ON "sport_session_log"("session_sport_block_id");

-- CreateIndex
CREATE INDEX "idx_incident_coach_status_created" ON "incident"("coach_membership_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "idx_incident_client_created" ON "incident"("client_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_incident_session" ON "incident"("session_id");

-- CreateIndex
CREATE INDEX "idx_incident_action_incident_created" ON "incident_action"("incident_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_coach_note_coach_archived" ON "coach_note"("coach_membership_id", "archived_at");

-- CreateIndex
CREATE INDEX "idx_coach_note_client" ON "coach_note"("client_id");

-- CreateIndex
CREATE INDEX "idx_weekly_report_coach_week" ON "weekly_report"("coach_membership_id", "week_start_date");

-- CreateIndex
CREATE INDEX "idx_weekly_report_client_report_date" ON "weekly_report"("client_id", "report_date");

-- CreateIndex
CREATE UNIQUE INDEX "uq_weekly_report_client_week" ON "weekly_report"("client_id", "week_start_date");

-- CreateIndex
CREATE INDEX "idx_chat_thread_client_updated" ON "chat_thread"("client_id", "updated_at");

-- CreateIndex
CREATE INDEX "idx_chat_thread_coach_updated" ON "chat_thread"("coach_membership_id", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_chat_thread_coach_client" ON "chat_thread"("coach_membership_id", "client_id");

-- CreateIndex
CREATE INDEX "idx_chat_message_thread_created" ON "chat_message"("thread_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_chat_message_expires" ON "chat_message"("expires_at");

-- CreateIndex
CREATE INDEX "idx_chat_attachment_message" ON "chat_attachment"("message_id");

-- CreateIndex
CREATE INDEX "idx_chat_attachment_expires" ON "chat_attachment"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_chat_attachment_message_path" ON "chat_attachment"("message_id", "storage_path");

-- CreateIndex
CREATE UNIQUE INDEX "notification_device_token_token_key" ON "notification_device_token"("token");

-- CreateIndex
CREATE INDEX "idx_notification_device_org_role_active" ON "notification_device_token"("organization_id", "role", "is_active");

-- CreateIndex
CREATE INDEX "idx_notification_device_membership_active" ON "notification_device_token"("membership_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_notification_pref_coach" ON "notification_preference"("coach_membership_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_notification_pref_coach_topic" ON "notification_preference"("coach_membership_id", "topic");

-- CreateIndex
CREATE UNIQUE INDEX "notification_event_log_dedupe_key_key" ON "notification_event_log"("dedupe_key");

-- CreateIndex
CREATE INDEX "idx_notification_event_org_topic_created" ON "notification_event_log"("organization_id", "topic", "created_at");

-- CreateIndex
CREATE INDEX "idx_notification_event_coach_topic_created" ON "notification_event_log"("coach_membership_id", "topic", "created_at");

-- CreateIndex
CREATE INDEX "idx_notification_event_client_topic_created" ON "notification_event_log"("client_id", "topic", "created_at");

-- CreateIndex
CREATE INDEX "idx_calendar_event_coach_date" ON "calendar_event"("coach_membership_id", "date");

-- CreateIndex
CREATE INDEX "idx_calendar_event_client_date" ON "calendar_event"("client_id", "date");

-- AddForeignKey
ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_subscription" ADD CONSTRAINT "organization_subscription_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client" ADD CONSTRAINT "client_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client" ADD CONSTRAINT "client_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client" ADD CONSTRAINT "client_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "client_objective"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client" ADD CONSTRAINT "client_training_plan_id_fkey" FOREIGN KEY ("training_plan_id") REFERENCES "plan_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_management_section" ADD CONSTRAINT "client_management_section_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_progress_photo" ADD CONSTRAINT "client_progress_photo_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "isometric_exercise" ADD CONSTRAINT "isometric_exercise_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "isometric_exercise" ADD CONSTRAINT "isometric_exercise_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "isometric_exercise" ADD CONSTRAINT "isometric_exercise_isometric_type_id_fkey" FOREIGN KEY ("isometric_type_id") REFERENCES "isometric_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "isometric_exercise" ADD CONSTRAINT "isometric_exercise_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "exercise_equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "isometric_exercise" ADD CONSTRAINT "isometric_exercise_movement_pattern_id_fkey" FOREIGN KEY ("movement_pattern_id") REFERENCES "movement_pattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "isometric_exercise" ADD CONSTRAINT "isometric_exercise_anatomical_plane_id_fkey" FOREIGN KEY ("anatomical_plane_id") REFERENCES "anatomical_plane"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_muscle_group_assignment" ADD CONSTRAINT "exercise_muscle_group_assignment_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_muscle_group_assignment" ADD CONSTRAINT "exercise_muscle_group_assignment_muscle_group_id_fkey" FOREIGN KEY ("muscle_group_id") REFERENCES "exercise_muscle_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "exercise_equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_movement_pattern_id_fkey" FOREIGN KEY ("movement_pattern_id") REFERENCES "movement_pattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_anatomical_plane_id_fkey" FOREIGN KEY ("anatomical_plane_id") REFERENCES "anatomical_plane"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cardio_method" ADD CONSTRAINT "cardio_method_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cardio_method" ADD CONSTRAINT "cardio_method_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cardio_method" ADD CONSTRAINT "cardio_method_method_type_id_fkey" FOREIGN KEY ("method_type_id") REFERENCES "cardio_method_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cardio_method" ADD CONSTRAINT "cardio_method_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "exercise_equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cardio_method" ADD CONSTRAINT "cardio_method_movement_pattern_id_fkey" FOREIGN KEY ("movement_pattern_id") REFERENCES "movement_pattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cardio_method" ADD CONSTRAINT "cardio_method_anatomical_plane_id_fkey" FOREIGN KEY ("anatomical_plane_id") REFERENCES "anatomical_plane"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food" ADD CONSTRAINT "food_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food" ADD CONSTRAINT "food_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plio_exercise" ADD CONSTRAINT "plio_exercise_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plio_exercise" ADD CONSTRAINT "plio_exercise_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plio_exercise" ADD CONSTRAINT "plio_exercise_plio_type_id_fkey" FOREIGN KEY ("plio_type_id") REFERENCES "plio_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plio_exercise" ADD CONSTRAINT "plio_exercise_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "exercise_equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plio_exercise" ADD CONSTRAINT "plio_exercise_movement_pattern_id_fkey" FOREIGN KEY ("movement_pattern_id") REFERENCES "movement_pattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plio_exercise" ADD CONSTRAINT "plio_exercise_anatomical_plane_id_fkey" FOREIGN KEY ("anatomical_plane_id") REFERENCES "anatomical_plane"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobility_exercise" ADD CONSTRAINT "mobility_exercise_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobility_exercise" ADD CONSTRAINT "mobility_exercise_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobility_exercise" ADD CONSTRAINT "mobility_exercise_mobility_type_id_fkey" FOREIGN KEY ("mobility_type_id") REFERENCES "mobility_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobility_exercise" ADD CONSTRAINT "mobility_exercise_movement_pattern_id_fkey" FOREIGN KEY ("movement_pattern_id") REFERENCES "movement_pattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobility_exercise" ADD CONSTRAINT "mobility_exercise_anatomical_plane_id_fkey" FOREIGN KEY ("anatomical_plane_id") REFERENCES "anatomical_plane"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobility_exercise" ADD CONSTRAINT "mobility_exercise_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "exercise_equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport" ADD CONSTRAINT "sport_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport" ADD CONSTRAINT "sport_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport" ADD CONSTRAINT "sport_sport_type_id_fkey" FOREIGN KEY ("sport_type_id") REFERENCES "sport_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport" ADD CONSTRAINT "sport_movement_pattern_id_fkey" FOREIGN KEY ("movement_pattern_id") REFERENCES "movement_pattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport" ADD CONSTRAINT "sport_anatomical_plane_id_fkey" FOREIGN KEY ("anatomical_plane_id") REFERENCES "anatomical_plane"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport" ADD CONSTRAINT "sport_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "exercise_equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_template" ADD CONSTRAINT "plan_template_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_template" ADD CONSTRAINT "plan_template_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_template_neat" ADD CONSTRAINT "plan_template_neat_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "plan_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_template_objective" ADD CONSTRAINT "plan_template_objective_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "plan_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_template_objective" ADD CONSTRAINT "plan_template_objective_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "routine_objective"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warmup_template_group" ADD CONSTRAINT "warmup_template_group_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "warmup_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warmup_template" ADD CONSTRAINT "warmup_template_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warmup_template" ADD CONSTRAINT "warmup_template_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warmup_template_item" ADD CONSTRAINT "warmup_template_item_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "warmup_template_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warmup_template_item" ADD CONSTRAINT "warmup_template_item_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "warmup_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warmup_template_item" ADD CONSTRAINT "warmup_template_item_exercise_library_id_fkey" FOREIGN KEY ("exercise_library_id") REFERENCES "exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warmup_template_item" ADD CONSTRAINT "warmup_template_item_cardio_method_library_id_fkey" FOREIGN KEY ("cardio_method_library_id") REFERENCES "cardio_method"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warmup_template_item" ADD CONSTRAINT "warmup_template_item_plio_exercise_library_id_fkey" FOREIGN KEY ("plio_exercise_library_id") REFERENCES "plio_exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warmup_template_item" ADD CONSTRAINT "warmup_template_item_mobility_exercise_library_id_fkey" FOREIGN KEY ("mobility_exercise_library_id") REFERENCES "mobility_exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_day" ADD CONSTRAINT "plan_day_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "plan_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_day_warmup" ADD CONSTRAINT "plan_day_warmup_plan_day_id_fkey" FOREIGN KEY ("plan_day_id") REFERENCES "plan_day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_day_warmup" ADD CONSTRAINT "plan_day_warmup_warmup_template_id_fkey" FOREIGN KEY ("warmup_template_id") REFERENCES "warmup_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_strength_exercise" ADD CONSTRAINT "plan_strength_exercise_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "plan_day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_strength_exercise" ADD CONSTRAINT "plan_strength_exercise_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "plan_exercise_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_strength_exercise" ADD CONSTRAINT "plan_strength_exercise_exercise_library_id_fkey" FOREIGN KEY ("exercise_library_id") REFERENCES "exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_mode" ADD CONSTRAINT "field_mode_plan_strength_exercise_id_fkey" FOREIGN KEY ("plan_strength_exercise_id") REFERENCES "plan_strength_exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_cardio_block" ADD CONSTRAINT "plan_cardio_block_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "plan_day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_cardio_block" ADD CONSTRAINT "plan_cardio_block_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "plan_exercise_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_cardio_block" ADD CONSTRAINT "plan_cardio_block_cardio_method_library_id_fkey" FOREIGN KEY ("cardio_method_library_id") REFERENCES "cardio_method"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cardio_field_mode" ADD CONSTRAINT "cardio_field_mode_plan_cardio_block_id_fkey" FOREIGN KEY ("plan_cardio_block_id") REFERENCES "plan_cardio_block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_plio_block" ADD CONSTRAINT "plan_plio_block_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "plan_day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_plio_block" ADD CONSTRAINT "plan_plio_block_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "plan_exercise_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_plio_block" ADD CONSTRAINT "plan_plio_block_plio_exercise_library_id_fkey" FOREIGN KEY ("plio_exercise_library_id") REFERENCES "plio_exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plio_field_mode" ADD CONSTRAINT "plio_field_mode_plan_plio_block_id_fkey" FOREIGN KEY ("plan_plio_block_id") REFERENCES "plan_plio_block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_mobility_block" ADD CONSTRAINT "plan_mobility_block_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "plan_day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_mobility_block" ADD CONSTRAINT "plan_mobility_block_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "plan_exercise_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_mobility_block" ADD CONSTRAINT "plan_mobility_block_mobility_exercise_library_id_fkey" FOREIGN KEY ("mobility_exercise_library_id") REFERENCES "mobility_exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobility_field_mode" ADD CONSTRAINT "mobility_field_mode_plan_mobility_block_id_fkey" FOREIGN KEY ("plan_mobility_block_id") REFERENCES "plan_mobility_block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_sport_block" ADD CONSTRAINT "plan_sport_block_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "plan_day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_sport_block" ADD CONSTRAINT "plan_sport_block_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "plan_exercise_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_sport_block" ADD CONSTRAINT "plan_sport_block_sport_library_id_fkey" FOREIGN KEY ("sport_library_id") REFERENCES "sport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport_field_mode" ADD CONSTRAINT "sport_field_mode_plan_sport_block_id_fkey" FOREIGN KEY ("plan_sport_block_id") REFERENCES "plan_sport_block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_exercise_group" ADD CONSTRAINT "plan_exercise_group_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "plan_day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_isometric_block" ADD CONSTRAINT "plan_isometric_block_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "plan_day"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_isometric_block" ADD CONSTRAINT "plan_isometric_block_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "plan_exercise_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_isometric_block" ADD CONSTRAINT "plan_isometric_block_isometric_exercise_library_id_fkey" FOREIGN KEY ("isometric_exercise_library_id") REFERENCES "isometric_exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "isometric_field_mode" ADD CONSTRAINT "isometric_field_mode_plan_isometric_block_id_fkey" FOREIGN KEY ("plan_isometric_block_id") REFERENCES "plan_isometric_block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_strength_set" ADD CONSTRAINT "plan_strength_set_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "plan_strength_exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_cardio_set" ADD CONSTRAINT "plan_cardio_set_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "plan_cardio_block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_plio_set" ADD CONSTRAINT "plan_plio_set_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "plan_plio_block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_isometric_set" ADD CONSTRAINT "plan_isometric_set_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "plan_isometric_block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_mobility_set" ADD CONSTRAINT "plan_mobility_set_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "plan_mobility_block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_sport_set" ADD CONSTRAINT "plan_sport_set_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "plan_sport_block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_instance" ADD CONSTRAINT "session_instance_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_instance" ADD CONSTRAINT "session_instance_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_instance" ADD CONSTRAINT "session_instance_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_instance" ADD CONSTRAINT "session_instance_source_template_id_fkey" FOREIGN KEY ("source_template_id") REFERENCES "plan_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_instance" ADD CONSTRAINT "session_instance_plan_day_id_fkey" FOREIGN KEY ("plan_day_id") REFERENCES "plan_day"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_strength_item" ADD CONSTRAINT "session_strength_item_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "set_log" ADD CONSTRAINT "set_log_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "set_log" ADD CONSTRAINT "set_log_session_item_id_fkey" FOREIGN KEY ("session_item_id") REFERENCES "session_strength_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_cardio_block" ADD CONSTRAINT "session_cardio_block_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interval_log" ADD CONSTRAINT "interval_log_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interval_log" ADD CONSTRAINT "interval_log_session_cardio_block_id_fkey" FOREIGN KEY ("session_cardio_block_id") REFERENCES "session_cardio_block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_plio_block" ADD CONSTRAINT "session_plio_block_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plio_set_log" ADD CONSTRAINT "plio_set_log_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plio_set_log" ADD CONSTRAINT "plio_set_log_session_plio_block_id_fkey" FOREIGN KEY ("session_plio_block_id") REFERENCES "session_plio_block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_mobility_block" ADD CONSTRAINT "session_mobility_block_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobility_set_log" ADD CONSTRAINT "mobility_set_log_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobility_set_log" ADD CONSTRAINT "mobility_set_log_session_mobility_block_id_fkey" FOREIGN KEY ("session_mobility_block_id") REFERENCES "session_mobility_block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_isometric_block" ADD CONSTRAINT "session_isometric_block_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "isometric_set_log" ADD CONSTRAINT "isometric_set_log_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "isometric_set_log" ADD CONSTRAINT "isometric_set_log_session_isometric_block_id_fkey" FOREIGN KEY ("session_isometric_block_id") REFERENCES "session_isometric_block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_sport_block" ADD CONSTRAINT "session_sport_block_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport_session_log" ADD CONSTRAINT "sport_session_log_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sport_session_log" ADD CONSTRAINT "sport_session_log_session_sport_block_id_fkey" FOREIGN KEY ("session_sport_block_id") REFERENCES "session_sport_block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident" ADD CONSTRAINT "incident_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident" ADD CONSTRAINT "incident_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident" ADD CONSTRAINT "incident_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident" ADD CONSTRAINT "incident_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session_instance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident" ADD CONSTRAINT "incident_session_item_id_fkey" FOREIGN KEY ("session_item_id") REFERENCES "session_strength_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_action" ADD CONSTRAINT "incident_action_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_note" ADD CONSTRAINT "coach_note_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_note" ADD CONSTRAINT "coach_note_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_report" ADD CONSTRAINT "weekly_report_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_report" ADD CONSTRAINT "weekly_report_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_report" ADD CONSTRAINT "weekly_report_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_report" ADD CONSTRAINT "weekly_report_source_session_id_fkey" FOREIGN KEY ("source_session_id") REFERENCES "session_instance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_thread" ADD CONSTRAINT "chat_thread_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_thread" ADD CONSTRAINT "chat_thread_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_thread" ADD CONSTRAINT "chat_thread_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "chat_thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_attachment" ADD CONSTRAINT "chat_attachment_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat_message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_device_token" ADD CONSTRAINT "notification_device_token_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_device_token" ADD CONSTRAINT "notification_device_token_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "organization_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_event_log" ADD CONSTRAINT "notification_event_log_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_event_log" ADD CONSTRAINT "notification_event_log_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_event_log" ADD CONSTRAINT "notification_event_log_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_coach_membership_id_fkey" FOREIGN KEY ("coach_membership_id") REFERENCES "organization_member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_plan_day_id_fkey" FOREIGN KEY ("plan_day_id") REFERENCES "plan_day"("id") ON DELETE SET NULL ON UPDATE CASCADE;
