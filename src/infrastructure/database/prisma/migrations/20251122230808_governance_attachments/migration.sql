/*
  Warnings:

  - Added the required column `maxFileSizeMB` to the `attachment_types` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "attachment_types" ADD COLUMN     "allowedExtensions" TEXT[],
ADD COLUMN     "maxFileSizeMB" INTEGER NOT NULL;
