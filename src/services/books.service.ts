import { Prisma } from "#generated/prisma/client.ts";
import type { ShelfBook } from "#generated/prisma/client.ts";
import { conflict } from "#src/lib/http-error.ts";
import { prisma } from "#src/lib/prisma.ts";
import type { AddShelfBookPayload } from "#src/dtos/books.dto.ts";

function mapToBookPayload(
  params: AddShelfBookPayload,
): Prisma.ShelfBookCreateInput {
  return {
    key: params.key,
    title: params.title,
    author_name: Array.isArray(params.author_name)
      ? params.author_name.join(", ")
      : (params.author_name ?? null),
    cover_i: params.cover_i ?? null,
    first_publish_year: params.first_publish_year ?? null,
    total_pages: params.number_of_pages_median ?? null,
    status: params.status,
  };
}

export async function addBookShelfService(
  payload: AddShelfBookPayload,
): Promise<ShelfBook> {
  try {
    return await prisma.shelfBook.create({
      data: mapToBookPayload(payload),
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw conflict(`Sách "${payload.key}" đã có trong tủ`);
    }

    throw error;
  }
}
