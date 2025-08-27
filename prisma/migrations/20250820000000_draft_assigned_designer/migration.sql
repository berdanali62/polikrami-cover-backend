-- AlterTable: add assignedDesignerId to Draft
ALTER TABLE "Draft" ADD COLUMN "assignedDesignerId" TEXT;

-- Add FK
ALTER TABLE "Draft" ADD CONSTRAINT "Draft_assignedDesignerId_fkey" FOREIGN KEY ("assignedDesignerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Index
CREATE INDEX "Draft_assignedDesignerId_idx" ON "Draft"("assignedDesignerId");

