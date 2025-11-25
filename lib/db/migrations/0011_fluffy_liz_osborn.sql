CREATE TABLE IF NOT EXISTS "AgentShare" (
	"id" text PRIMARY KEY NOT NULL,
	"agentId" text NOT NULL,
	"userId" uuid NOT NULL,
	"sharedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "AIAgent" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"systemPrompt" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"icon" varchar(10) DEFAULT '🤖' NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"isPreset" boolean DEFAULT false NOT NULL,
	"isPublic" boolean DEFAULT false NOT NULL,
	"usageCount" integer DEFAULT 0 NOT NULL,
	"shareCode" varchar(32),
	"allowShare" boolean DEFAULT false NOT NULL,
	"shareCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "AIAgent_shareCode_unique" UNIQUE("shareCode")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AgentShare" ADD CONSTRAINT "AgentShare_agentId_AIAgent_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."AIAgent"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AgentShare" ADD CONSTRAINT "AgentShare_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "AIAgent" ADD CONSTRAINT "AIAgent_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_agent_share_user_id" ON "AgentShare" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_agent_share_agent_id" ON "AgentShare" USING btree ("agentId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_agent_share_active" ON "AgentShare" USING btree ("userId","isActive");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_agent" ON "AgentShare" USING btree ("userId","agentId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_agent_user_id" ON "AIAgent" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_agent_category" ON "AIAgent" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_agent_is_preset" ON "AIAgent" USING btree ("isPreset");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_agent_is_public" ON "AIAgent" USING btree ("isPublic");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_agent_usage_count" ON "AIAgent" USING btree ("usageCount" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_agent_created_at" ON "AIAgent" USING btree ("createdAt" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_agent_share_code" ON "AIAgent" USING btree ("shareCode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_user_id_idx" ON "Chat" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_created_at_idx" ON "Chat" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_user_id_created_at_idx" ON "Chat" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "iflow_message_workspace_id_idx" ON "IFlowMessage" USING btree ("workspaceId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "iflow_message_created_at_idx" ON "IFlowMessage" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "iflow_message_workspace_created_idx" ON "IFlowMessage" USING btree ("workspaceId","createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_v2_chat_id_idx" ON "Message_v2" USING btree ("chatId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "message_v2_created_at_idx" ON "Message_v2" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_email_idx" ON "User" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "website_deployment_workspace_id_idx" ON "WebsiteDeployment" USING btree ("workspaceId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "website_deployment_user_id_idx" ON "WebsiteDeployment" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "website_deployment_status_idx" ON "WebsiteDeployment" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workspace_user_id_idx" ON "Workspace" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workspace_last_accessed_at_idx" ON "Workspace" USING btree ("lastAccessedAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workspace_user_id_last_accessed_idx" ON "Workspace" USING btree ("userId","lastAccessedAt");