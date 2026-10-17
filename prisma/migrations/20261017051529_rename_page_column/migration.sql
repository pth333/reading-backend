/*
  Warnings:

  - You are about to drop the column `totalPages` on the `shelf_books` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `shelf_books` DROP COLUMN `totalPages`,
    ADD COLUMN `total_pages` INTEGER NULL;
