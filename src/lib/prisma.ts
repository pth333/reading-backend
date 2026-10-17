import { existsSync } from "node:fs";
import { join } from "node:path";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "#generated/prisma/client.ts";

const ENV_PATH = join(import.meta.dirname, "../../.env");

if (!process.env.DATABASE_URL && existsSync(ENV_PATH)) {
  process.loadEnvFile(ENV_PATH);
}

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error(
    "Thiếu biến môi trường DATABASE_URL. Hãy tạo file .env (copy từ .env.example) " +
      "rồi chạy app qua npm script, ví dụ: npm run dev",
  );
}

// Prisma 7 là bản Rust-free nên bắt buộc truyền driver adapter.
// Với MySQL/MariaDB ta dùng @prisma/adapter-mariadb; adapter tự quản lý connection pool.
const adapter = new PrismaMariaDb(DATABASE_URL);

export const prisma = new PrismaClient({ adapter });

export default prisma;
