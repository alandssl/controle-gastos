/*
  Warnings:

  - You are about to drop the column `gastoId` on the `Pagamento` table. All the data in the column will be lost.
  - Added the required column `pagamentoId` to the `Gasto` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Pagamento` DROP FOREIGN KEY `Pagamento_gastoId_fkey`;

-- DropIndex
DROP INDEX `Pagamento_gastoId_fkey` ON `Pagamento`;

-- AlterTable
ALTER TABLE `Gasto` ADD COLUMN `cartaoId` INTEGER NULL,
    ADD COLUMN `pagamentoId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Pagamento` DROP COLUMN `gastoId`;

-- AddForeignKey
ALTER TABLE `Gasto` ADD CONSTRAINT `Gasto_pagamentoId_fkey` FOREIGN KEY (`pagamentoId`) REFERENCES `Pagamento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Gasto` ADD CONSTRAINT `Gasto_cartaoId_fkey` FOREIGN KEY (`cartaoId`) REFERENCES `Cartao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
