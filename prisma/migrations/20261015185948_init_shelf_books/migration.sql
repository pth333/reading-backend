-- Migration: init_shelf_books
-- Bảng giá sách (shelf) cho ứng dụng đọc sách 1 người dùng.
--
-- DDL dưới đây bám sát CREATE TABLE bạn cung cấp, chỉ điều chỉnh 4 điểm để khớp
-- với prisma/schema.prisma và tránh drift khi chạy `prisma migrate dev` về sau:
--   1. UNIQUE INDEX đặt tên theo quy ước Prisma (`shelf_books_work_id_key`)
--      thay vì UNIQUE inline (MySQL sẽ tự đặt tên index là `work_id`).
--   2. created_at / updated_at thêm NOT NULL, khớp DateTime non-null của Prisma.
--   3. DATETIME -> DATETIME(3): Prisma dùng độ chính xác milli-giây cho DateTime.
--   4. CHECK (rating BETWEEN 1 AND 5) giữ nguyên, thêm bằng ALTER TABLE riêng
--      vì Prisma không khai báo được CHECK constraint trong schema.

-- CreateTable
CREATE TABLE `shelf_books` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(32) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `authors` VARCHAR(500) NULL,
    `cover_id` INTEGER NULL,
    `first_publish_year` SMALLINT NULL,
    `number_of_pages_median` INTEGER NULL,
    `status` ENUM('want', 'reading', 'read') NOT NULL DEFAULT 'want',
    `current_page` INTEGER NOT NULL DEFAULT 0,
    `rating` TINYINT NULL,
    `note` VARCHAR(500) NULL,
    `started_at` DATETIME(3) NULL,
    `finished_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `shelf_books_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddCheckConstraint
ALTER TABLE `shelf_books`
    ADD CONSTRAINT `shelf_books_rating_check` CHECK (`rating` BETWEEN 1 AND 5);
