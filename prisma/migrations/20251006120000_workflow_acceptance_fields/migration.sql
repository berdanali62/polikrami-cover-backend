-- Create enum type for draft workflow status
DO $$ BEGIN
  CREATE TYPE "WorkflowStatus" AS ENUM ('PENDING','APPROVED','IN_PROGRESS','PREVIEW_SENT','REVISION','COMPLETED','CANCELED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add fields to Draft
ALTER TABLE "Draft" ADD COLUMN IF NOT EXISTS "workflowStatus" "WorkflowStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Draft" ADD COLUMN IF NOT EXISTS "revisionCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Draft" ADD COLUMN IF NOT EXISTS "maxRevisions" INTEGER NOT NULL DEFAULT 3;

-- Add acceptance timestamps to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "privacyAcceptedAt" TIMESTAMP(3);

-- Add availability to UserProfile
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "isAvailable" BOOLEAN NOT NULL DEFAULT true;


