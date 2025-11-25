ALTER TABLE "AIAgent" ADD COLUMN "externalId" integer;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_agent_external_id" ON "AIAgent" USING btree ("externalId");--> statement-breakpoint
ALTER TABLE "AIAgent" ADD CONSTRAINT "AIAgent_externalId_unique" UNIQUE("externalId");