/*
  Warnings:

  - A unique constraint covering the columns `[transactionNo]` on the table `Inquiries` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `transactionNo` to the `Inquiries` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Inquiries" ADD COLUMN     "transactionNo" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Inquiries_transactionNo_key" ON "Inquiries"("transactionNo");
