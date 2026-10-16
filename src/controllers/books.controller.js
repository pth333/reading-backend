import { badRequest } from "#src/lib/http-error.js";
import { addBookShelfService } from "#src/services/books.service.js";
import { getBookDetailService } from "#src/services/openlibrary.service.js";

export async function addShelfBook(req, res) {
  if (!req.body) {
    throw badRequest("Thiếu dữ liệu sách");
  }
  const response = await addBookShelfService(req.body);
  return res.json(response);
}

export async function getBookDetail(req, res) {
  if (!req.query.key) {
    throw badRequest("Thiếu tham số key");
  }
  const response = await getBookDetailService(req.query.key);
  return res.json(response);
}
