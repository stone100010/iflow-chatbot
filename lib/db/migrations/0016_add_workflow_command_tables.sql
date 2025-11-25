CREATE TABLE IF NOT EXISTS "Command" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"externalId" integer,
	"name" varchar(100) NOT NULL,
	"description" text,
	"detailContext" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"modelName" varchar(50),
	"version" integer DEFAULT 1 NOT NULL,
	"isPreset" boolean DEFAULT false NOT NULL,
	"isPublic" boolean DEFAULT false NOT NULL,
	"usageCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "Command_externalId_unique" UNIQUE("externalId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Workflow" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"externalId" integer,
	"workflowId" varchar(100),
	"name" varchar(200) NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"downloadUrl" text,
	"folderStructure" jsonb,
	"isPreset" boolean DEFAULT false NOT NULL,
	"isPublic" boolean DEFAULT false NOT NULL,
	"usageCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "Workflow_externalId_unique" UNIQUE("externalId")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Command" ADD CONSTRAINT "Command_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_command_user_id" ON "Command" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_command_category" ON "Command" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_command_is_preset" ON "Command" USING btree ("isPreset");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_command_external_id" ON "Command" USING btree ("externalId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_workflow_user_id" ON "Workflow" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_workflow_category" ON "Workflow" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_workflow_is_preset" ON "Workflow" USING btree ("isPreset");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_workflow_external_id" ON "Workflow" USING btree ("externalId");