import { badRequest } from "#src/lib/http-error.js";
import { searchBooks } from "#src/services/openlibrary.service.js";

const DEFAULT_LIMIT = 10;


export async function search(req, res) {
  const { title, author, page, limit } = req.query;

  const params = {
    title: title ? String(title) : undefined,
    author: author ? String(author) : undefined,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : DEFAULT_LIMIT,
  };

  if (!params.title && !params.author) {
    throw badRequest('Thiếu từ khóa tìm kiếm: cần tên sách hoặc tác giả');
  }

  const { total, items } = await searchBooks({ params });

  res.json({ total, items, page: params.page, limit: params.limit });
}
