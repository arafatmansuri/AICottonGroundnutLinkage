-- Fix schema drift: add missing columns that exist in Prisma schema but not in the DB

-- 1. Add idempotencyKey to transactions
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_idempotencyKey_key" ON "transactions"("idempotencyKey");

-- 2. Fix audit_logs column names: entity -> entityType, changes -> details
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='entity') THEN
    ALTER TABLE "audit_logs" RENAME COLUMN "entity" TO "entityType";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='changes') THEN
    ALTER TABLE "audit_logs" RENAME COLUMN "changes" TO "details";
  END IF;
END $$;

-- 3. Add indexes on audit_logs (match schema @@index directives)
CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "audit_logs_entityType_idx" ON "audit_logs"("entityType");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
