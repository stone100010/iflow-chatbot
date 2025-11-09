CREATE TABLE IF NOT EXISTS "IFlowMessage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspaceId" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"agentInfo" jsonb,
	"toolCalls" jsonb,
	"plan" jsonb,
	"stopReason" varchar(20),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Workspace" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"path" varchar(500) NOT NULL,
	"size" text DEFAULT '0',
	"modelName" varchar(50) DEFAULT 'MiniMax-M2',
	"permissionMode" varchar(20) DEFAULT 'yolo',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"lastAccessedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "IFlowMessage" ADD CONSTRAINT "IFlowMessage_workspaceId_Workspace_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
