/*
  Warnings:

  - You are about to drop the column `authors` on the `shelf_books` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `shelf_books` DROP COLUMN `authors`,
    ADD COLUMN `author_name` VARCHAR(500) NULL,
    ADD COLUMN `description` TEXT NULL;
