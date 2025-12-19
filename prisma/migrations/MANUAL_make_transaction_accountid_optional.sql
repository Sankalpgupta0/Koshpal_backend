-- Migration: Make Transaction.accountId optional
-- This allows transactions to exist without linked accounts
-- Critical for SMS/mobile transaction ingestion where accounts may not exist yet

-- Step 1: Add new columns to Transaction table
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "merchant" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "bank" TEXT;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "maskedAccountNo" TEXT;

-- Step 2: Make accountId nullable (drop NOT NULL constraint)
ALTER TABLE "Transaction" ALTER COLUMN "accountId" DROP NOT NULL;

-- Step 3: Drop the existing foreign key constraint
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_accountId_fkey";

-- Step 4: Re-add foreign key constraint that allows NULL
ALTER TABLE "Transaction" 
  ADD CONSTRAINT "Transaction_accountId_fkey" 
  FOREIGN KEY ("accountId") 
  REFERENCES "Account"("id") 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- Step 5: Add index on accountId for better query performance
CREATE INDEX IF NOT EXISTS "Transaction_accountId_idx" ON "Transaction"("accountId");

-- Step 6: Update Account table to add bank field and unique constraint
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "bank" TEXT;

-- Step 7: Create unique constraint for auto-account creation
-- Note: This may fail if duplicates exist, handle accordingly
DO $$ 
BEGIN
  ALTER TABLE "Account" 
    ADD CONSTRAINT "unique_user_account" 
    UNIQUE ("userId", "maskedAccountNo", "provider");
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- Step 8: Update existing transactions statistics
-- Mark all existing transactions with accountId as linked
COMMENT ON COLUMN "Transaction"."accountId" IS 'Optional: Transaction can exist without account. Source of truth is transaction data, not account linkage.';

-- Verification queries (run these after migration to verify)
-- SELECT COUNT(*) FROM "Transaction" WHERE "accountId" IS NULL; -- Should work
-- SELECT COUNT(*) FROM "Transaction" WHERE "accountId" IS NOT NULL; -- Should show all existing
