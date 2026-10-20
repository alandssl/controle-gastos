/*
  Warnings:

  - You are about to alter the column `valorGasto` on the `Gasto` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Double`.
  - You are about to alter the column `valorPago` on the `Pagamento` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Double`.
  - You are about to alter the column `valorParcela` on the `Pagamento` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Double`.
  - You are about to alter the column `salario` on the `Usuario` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Double`.

*/
-- AlterTable
ALTER TABLE `Gasto` MODIFY `valorGasto` DOUBLE NOT NULL;

-- AlterTable
ALTER TABLE `Pagamento` MODIFY `valorPago` DOUBLE NULL,
    MODIFY `valorParcela` DOUBLE NULL;

-- AlterTable
ALTER TABLE `Usuario` MODIFY `salario` DOUBLE NOT NULL;
