import { Prisma, ShelfStatus } from "#generated/prisma/client.ts";
import type { ShelfBook } from "#generated/prisma/client.ts";
import type {
  ListBooksDTO,
  ListBooksResult,
  UpdateShelfBookDTO,
} from "#src/dtos/shelf-books.dto.ts";
import { badRequest, notFound } from "#src/lib/http-error.ts";
import { prisma } from "#src/lib/prisma.ts";
import path from "node:path";

export async function listBooksService(
  data: ListBooksDTO,
): Promise<ListBooksResult> {
  try {
    const skip = (data.page - 1) * data.limit;
    const where = data.status ? { status: data.status } : undefined;

    const [items, total, grouped] = await Promise.all([
      prisma.shelfBook.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: data.limit,
      }),
      prisma.shelfBook.count(),
      prisma.shelfBook.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    const countByStatus = (target: string): number =>
      grouped.find((row) => row.status === target)?._count._all ?? 0;

    return {
      items,
      stats: {
        total,
        reading: countByStatus("reading"),
        read: countByStatus("read"),
      },
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      throw new Error(`Không kết nối được database: ${error.message}`);
    }

    throw error;
  }
}

export async function updateShelfBookService(
  data: UpdateShelfBookDTO,
): Promise<ShelfBook> {
  const { id, ...patch } = data;
  const now = new Date();

  const current = await prisma.shelfBook.findUnique({ where: { id } });

  if (!current) {
    throw notFound(`Không tìm thấy sách với id ${id}`);
  }

  if (patch.current_page !== undefined) {
    if (patch.current_page < 0) {
      throw badRequest("Số trang đang đọc phải lớn hơn hoặc bằng 0");
    }

    const totalPages = current.total_pages;

    if (totalPages !== null) {
      if (patch.current_page > totalPages) {
        throw badRequest(
          `Số trang đang đọc (${patch.current_page}) vượt quá tổng số trang (${totalPages})`,
        );
      }

      const isFinished =
        patch.status === ShelfStatus.read || patch.current_page === totalPages;

      if (isFinished) {
        patch.status = ShelfStatus.read;
        patch.current_page = totalPages;
        patch.finished_at = now;
      }

      if (patch.current_page > 0 && patch.current_page < totalPages) {
        patch.status = "reading";
      }
    }
  }

  if (!patch.started_at && patch.status === ShelfStatus.reading) {
    patch.started_at = now;
  }

  try {
    return await prisma.shelfBook.update({
      where: { id },
      data: patch,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw notFound(`Không tìm thấy sách với id ${id}`);
    }

    throw error;
  }
}

export async function checkExistBookService(
  key: string,
): Promise<ShelfBook | null> {
  if (!key) {
    return null;
  }

  try {
    return await prisma.shelfBook.findUnique({
      where: { key },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      throw new Error(`Không kết nối được database: ${error.message}`);
    }

    throw error;
  }
}

export async function deleteShelfBookService(
  bookId: number,
): Promise<ShelfBook> {
  try {
    return await prisma.shelfBook.delete({
      where: { id: bookId },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw notFound(`Không tìm thấy sách với id ${bookId}`);
    }

    throw error;
  }
}
