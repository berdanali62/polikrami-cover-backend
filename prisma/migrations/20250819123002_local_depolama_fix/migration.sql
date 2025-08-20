/*
  Warnings:

  - You are about to drop the column `provider` on the `Asset` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Asset` table. All the data in the column will be lost.
  - Added the required column `bytes` to the `Asset` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mimeType` to the `Asset` table without a default value. This is not possible if the table is not empty.
  - Added the required column `path` to the `Asset` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Asset" DROP COLUMN "provider",
DROP COLUMN "url",
ADD COLUMN     "bytes" INTEGER NOT NULL,
ADD COLUMN     "mimeType" TEXT NOT NULL,
ADD COLUMN     "path" TEXT NOT NULL;
