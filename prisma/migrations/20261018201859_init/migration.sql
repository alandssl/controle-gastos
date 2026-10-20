-- CreateTable
CREATE TABLE `Usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `salario` DECIMAL(10, 2) NOT NULL,
    `diaSalario` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Gasto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descricao` VARCHAR(191) NOT NULL,
    `tipoGasto` ENUM('ALIMENTACAO', 'TRANSPORTE', 'COMPRAS', 'LAZER', 'SAUDE', 'CASA', 'OUTROS') NOT NULL,
    `valorGasto` DECIMAL(10, 2) NOT NULL,
    `dataGasto` DATETIME(3) NOT NULL,
    `usuarioId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pagamento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `valorPago` DECIMAL(10, 2) NULL,
    `dataPago` DATETIME(3) NULL,
    `pagamentoFeito` BOOLEAN NOT NULL DEFAULT false,
    `tipoPagamento` ENUM('DEBITO', 'PIX', 'CREDITO') NULL,
    `cartao` VARCHAR(191) NULL,
    `gastoId` INTEGER NOT NULL,
    `parcelas` INTEGER NULL,
    `valorParcela` DECIMAL(10, 2) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Gasto` ADD CONSTRAINT `Gasto_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pagamento` ADD CONSTRAINT `Pagamento_gastoId_fkey` FOREIGN KEY (`gastoId`) REFERENCES `Gasto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
