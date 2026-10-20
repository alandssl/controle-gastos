/*
  Warnings:

  - You are about to drop the column `cartao` on the `Pagamento` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Pagamento` DROP COLUMN `cartao`,
    ADD COLUMN `cartaoId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Cartao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `diaVencimento` INTEGER NOT NULL,
    `valorFaturaMes` DOUBLE NOT NULL,
    `usuarioId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Pagamento` ADD CONSTRAINT `Pagamento_cartaoId_fkey` FOREIGN KEY (`cartaoId`) REFERENCES `Cartao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cartao` ADD CONSTRAINT `Cartao_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
