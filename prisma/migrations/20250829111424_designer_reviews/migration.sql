-- CreateTable
CREATE TABLE "DesignerReview" (
    "id" TEXT NOT NULL,
    "designerId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignerReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DesignerReview_designerId_createdAt_idx" ON "DesignerReview"("designerId", "createdAt");

-- CreateIndex
CREATE INDEX "DesignerReview_reviewerId_createdAt_idx" ON "DesignerReview"("reviewerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DesignerReview_designerId_reviewerId_key" ON "DesignerReview"("designerId", "reviewerId");

-- AddForeignKey
ALTER TABLE "DesignerReview" ADD CONSTRAINT "DesignerReview_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignerReview" ADD CONSTRAINT "DesignerReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
