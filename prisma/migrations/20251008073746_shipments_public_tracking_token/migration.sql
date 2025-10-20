-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "trackingToken" TEXT;

-- CreateIndex
CREATE INDEX "Shipment_trackingToken_idx" ON "Shipment"("trackingToken");
