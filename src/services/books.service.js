import { Prisma } from "#generated/prisma/client.ts";
import { conflict } from "#src/lib/http-error.js";
import { prisma } from "#src/lib/prisma.js";

export async function addBookShelfService(data) {

  try {
    return await prisma.shelfBook.create({ data });
  } catch (error) {
    // key có ràng buộc UNIQUE -> thêm trùng thì trả 409.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw conflict(`Sách "${data.key}" đã có trong tủ`);
    }

    throw error;
  }
}
