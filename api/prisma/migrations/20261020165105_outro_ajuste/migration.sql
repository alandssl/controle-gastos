/*
  Warnings:

  - You are about to drop the column `cartaoId` on the `Gasto` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Gasto` DROP FOREIGN KEY `Gasto_cartaoId_fkey`;

-- DropIndex
DROP INDEX `Gasto_cartaoId_fkey` ON `Gasto`;

-- AlterTable
ALTER TABLE `Gasto` DROP COLUMN `cartaoId`;
