import { Prisma, ShelfStatus } from "#generated/prisma/client.ts";
import type { ShelfBook } from "#generated/prisma/client.ts";
import { conflict } from "#src/lib/http-error.ts";
import { prisma } from "#src/lib/prisma.ts";
import type { AddShelfBookPayload } from "#src/dtos/books.dto.ts";

function mapToBookPayload(
  params: AddShelfBookPayload,
): Prisma.ShelfBookCreateInput {
  const now = new Date();

  if (!params.started_at && params.status === ShelfStatus.reading) {
    params.started_at = now;
  }

  if (params.status === ShelfStatus.read) {
    params.finished_at = now;
  }

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
    description: params.description,
    started_at: params.started_at,
    finished_at: params.finished_at,
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
      throw conflict(`Sách đã có trong tủ`);
    }

    throw error;
  }
}
