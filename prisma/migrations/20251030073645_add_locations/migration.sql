/*
  Warnings:

  - You are about to drop the column `district` on the `Address` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Address" DROP COLUMN "district",
ADD COLUMN     "districtId" INTEGER,
ADD COLUMN     "districtName" TEXT,
ADD COLUMN     "provinceId" INTEGER,
ADD COLUMN     "quarterId" INTEGER,
ADD COLUMN     "townId" INTEGER;

-- CreateTable
CREATE TABLE "DraftAssignmentLog" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "designerId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "previousDesignerId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DraftAssignmentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentCallbackLog" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amountCents" INTEGER,
    "signature" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentCallbackLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Province" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "alpha2Code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Province_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Town" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "provinceId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Town_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "townId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quarter" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "districtId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quarter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DraftAssignmentLog_draftId_idx" ON "DraftAssignmentLog"("draftId");

-- CreateIndex
CREATE INDEX "DraftAssignmentLog_designerId_idx" ON "DraftAssignmentLog"("designerId");

-- CreateIndex
CREATE INDEX "DraftAssignmentLog_timestamp_idx" ON "DraftAssignmentLog"("timestamp");

-- CreateIndex
CREATE INDEX "PaymentCallbackLog_paymentId_idx" ON "PaymentCallbackLog"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentCallbackLog_timestamp_idx" ON "PaymentCallbackLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Province_alpha2Code_key" ON "Province"("alpha2Code");

-- CreateIndex
CREATE INDEX "Province_name_idx" ON "Province"("name");

-- CreateIndex
CREATE INDEX "Town_name_idx" ON "Town"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Town_provinceId_name_key" ON "Town"("provinceId", "name");

-- CreateIndex
CREATE INDEX "District_name_idx" ON "District"("name");

-- CreateIndex
CREATE UNIQUE INDEX "District_townId_name_key" ON "District"("townId", "name");

-- CreateIndex
CREATE INDEX "Quarter_name_idx" ON "Quarter"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Quarter_districtId_name_key" ON "Quarter"("districtId", "name");

-- CreateIndex
CREATE INDEX "Address_provinceId_townId_districtId_quarterId_idx" ON "Address"("provinceId", "townId", "districtId", "quarterId");

-- AddForeignKey
ALTER TABLE "DraftAssignmentLog" ADD CONSTRAINT "DraftAssignmentLog_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "Draft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftAssignmentLog" ADD CONSTRAINT "DraftAssignmentLog_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DraftAssignmentLog" ADD CONSTRAINT "DraftAssignmentLog_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentCallbackLog" ADD CONSTRAINT "PaymentCallbackLog_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Town" ADD CONSTRAINT "Town_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_townId_fkey" FOREIGN KEY ("townId") REFERENCES "Town"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quarter" ADD CONSTRAINT "Quarter_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_townId_fkey" FOREIGN KEY ("townId") REFERENCES "Town"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_quarterId_fkey" FOREIGN KEY ("quarterId") REFERENCES "Quarter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
