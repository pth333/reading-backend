import { Prisma, ShelfStatus } from "#generated/prisma/client.ts";
import type { ShelfBook } from "#generated/prisma/client.ts";
import type {
  ListBooksDTO,
  ListBooksResult,
  UpdateShelfBookDTO,
} from "#src/dtos/shelf-books.dto.ts";
import { notFound } from "#src/lib/http-error.ts";
import { prisma } from "#src/lib/prisma.ts";

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
  try {
    const { id, ...rest } = data;

    return await prisma.shelfBook.update({
      where: { id },
      data: rest,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw notFound(`Không tìm thấy sách với id ${data.id}`);
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
