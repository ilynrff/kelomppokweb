/*
  Warnings:

  - The `images` column on the `Court` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Court" DROP COLUMN "images",
ADD COLUMN     "images" JSONB NOT NULL DEFAULT '[]';
