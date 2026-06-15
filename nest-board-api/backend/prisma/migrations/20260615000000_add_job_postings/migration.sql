CREATE TABLE `job_postings` (
    `id` VARCHAR(191) NOT NULL,
    `source` VARCHAR(80) NOT NULL,
    `externalId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `company` VARCHAR(120) NOT NULL,
    `location` VARCHAR(120) NULL,
    `experience` VARCHAR(120) NULL,
    `skills` JSON NULL,
    `description` TEXT NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `deadline` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'EXPIRED', 'HIDDEN') NOT NULL DEFAULT 'ACTIVE',
    `lastFetchedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `job_postings_source_externalId_key`(`source`, `externalId`),
    INDEX `job_postings_status_idx`(`status`),
    INDEX `job_postings_deadline_idx`(`deadline`),
    INDEX `job_postings_lastFetchedAt_idx`(`lastFetchedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
