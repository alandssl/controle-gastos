-- DropForeignKey
ALTER TABLE `Gasto` DROP FOREIGN KEY `Gasto_pagamentoId_fkey`;

-- DropIndex
DROP INDEX `Gasto_pagamentoId_fkey` ON `Gasto`;

-- AlterTable
ALTER TABLE `Gasto` MODIFY `pagamentoId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Gasto` ADD CONSTRAINT `Gasto_pagamentoId_fkey` FOREIGN KEY (`pagamentoId`) REFERENCES `Pagamento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
