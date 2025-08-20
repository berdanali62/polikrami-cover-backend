-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "currency" SET DEFAULT 'TRY';

-- CreateIndex
CREATE INDEX "Draft_userId_createdAt_idx" ON "Draft"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Draft_committedAt_idx" ON "Draft"("committedAt");

-- CreateIndex
CREATE INDEX "Draft_messageCardId_idx" ON "Draft"("messageCardId");

-- CreateIndex
CREATE INDEX "EmailQueue_status_scheduledAt_idx" ON "EmailQueue"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "EmailQueue_createdAt_idx" ON "EmailQueue"("createdAt");

-- CreateIndex
CREATE INDEX "MessageCard_isPublished_createdAt_idx" ON "MessageCard"("isPublished", "createdAt");

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Project_ownerId_status_createdAt_idx" ON "Project"("ownerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_revokedAt_createdAt_idx" ON "RefreshToken"("userId", "revokedAt", "createdAt");
