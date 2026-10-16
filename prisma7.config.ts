// Cấu hình Prisma CLI (Prisma 7)
// File này được Prisma tạo tự động; DATABASE_URL được nạp từ .env qua dotenv.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
