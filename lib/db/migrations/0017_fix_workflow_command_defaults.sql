-- Add default UUID to Workflow and Command tables
ALTER TABLE "Workflow" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "Command" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
