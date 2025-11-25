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
CREATE TABLE IF NOT EXISTS "ShareLike" (
	"id" text PRIMARY KEY NOT NULL,
	"shareId" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ShareSnapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"shareId" text NOT NULL,
	"messageId" text NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"sequenceNumber" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"messageCreatedAt" timestamp with time zone NOT NULL,
	"snapshotAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ShareView" (
	"id" text PRIMARY KEY NOT NULL,
	"shareId" text NOT NULL,
	"visitorId" text,
	"userId" text,
	"ipAddress" varchar(45),
	"userAgent" text,
	"referer" text,
	"country" varchar(2),
	"city" varchar(100),
	"viewedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Share" (
	"id" text PRIMARY KEY NOT NULL,
	"shortId" varchar(12) NOT NULL,
	"workspaceId" text NOT NULL,
	"userId" text NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"privacy" varchar(20) DEFAULT 'private' NOT NULL,
	"messageCount" integer DEFAULT 0 NOT NULL,
	"viewCount" integer DEFAULT 0 NOT NULL,
	"likeCount" integer DEFAULT 0 NOT NULL,
	"commentCount" integer DEFAULT 0 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"snapshotAt" timestamp with time zone NOT NULL,
	"ogTitle" varchar(200),
	"ogDescription" text,
	"ogImage" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "Share_shortId_unique" UNIQUE("shortId")
);
--> statement-breakpoint
ALTER TABLE "AIAgent" ADD COLUMN "externalId" integer;--> statement-breakpoint
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
DO $$ BEGIN
 ALTER TABLE "ShareLike" ADD CONSTRAINT "ShareLike_shareId_Share_id_fk" FOREIGN KEY ("shareId") REFERENCES "public"."Share"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ShareLike" ADD CONSTRAINT "ShareLike_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ShareSnapshot" ADD CONSTRAINT "ShareSnapshot_shareId_Share_id_fk" FOREIGN KEY ("shareId") REFERENCES "public"."Share"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ShareView" ADD CONSTRAINT "ShareView_shareId_Share_id_fk" FOREIGN KEY ("shareId") REFERENCES "public"."Share"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ShareView" ADD CONSTRAINT "ShareView_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Share" ADD CONSTRAINT "Share_workspaceId_Workspace_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Share" ADD CONSTRAINT "Share_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
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
CREATE INDEX IF NOT EXISTS "idx_workflow_external_id" ON "Workflow" USING btree ("externalId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_share_like_share_id" ON "ShareLike" USING btree ("shareId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_share_like_user_id" ON "ShareLike" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_share_like_unique" ON "ShareLike" USING btree ("shareId","userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_share_snapshot_share_id" ON "ShareSnapshot" USING btree ("shareId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_share_snapshot_sequence" ON "ShareSnapshot" USING btree ("shareId","sequenceNumber");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_share_snapshot_unique_sequence" ON "ShareSnapshot" USING btree ("shareId","sequenceNumber");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_share_view_share_id" ON "ShareView" USING btree ("shareId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_share_view_viewed_at" ON "ShareView" USING btree ("viewedAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_share_view_visitor_id" ON "ShareView" USING btree ("visitorId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_share_short_id" ON "Share" USING btree ("shortId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_share_user_id" ON "Share" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_share_workspace_id" ON "Share" USING btree ("workspaceId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_share_created_at" ON "Share" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_share_view_count" ON "Share" USING btree ("viewCount");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_share_privacy" ON "Share" USING btree ("privacy");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_share_is_active" ON "Share" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_agent_external_id" ON "AIAgent" USING btree ("externalId");--> statement-breakpoint
ALTER TABLE "AIAgent" ADD CONSTRAINT "AIAgent_externalId_unique" UNIQUE("externalId");