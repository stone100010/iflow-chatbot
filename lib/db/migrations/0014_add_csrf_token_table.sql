CREATE TABLE IF NOT EXISTS "CsrfToken" (
  "token" TEXT PRIMARY KEY NOT NULL,
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS "csrf_token_user_id_idx" ON "CsrfToken"("userId");
CREATE INDEX IF NOT EXISTS "csrf_token_expires_at_idx" ON "CsrfToken"("expiresAt");
