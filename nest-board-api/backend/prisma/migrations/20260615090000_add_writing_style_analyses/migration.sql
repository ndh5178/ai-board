CREATE TABLE `writing_style_analyses` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `sourceHash` VARCHAR(64) NOT NULL,
    `postCount` INTEGER NOT NULL,
    `result` JSON NOT NULL,
    `analyzedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `writing_style_analyses_userId_idx`(`userId`),
    INDEX `writing_style_analyses_analyzedAt_idx`(`analyzedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `writing_style_analyses`
ADD CONSTRAINT `writing_style_analyses_userId_fkey`
FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;
