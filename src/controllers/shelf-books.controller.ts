import type { Request, Response } from "express";

import type {
  CheckExistBookDTO,
  DeleteBookDTO,
  ListBooksDTO,
  UpdateShelfBookDTO,
} from "#src/dtos/shelf-books.dto.ts";
import {
  updateShelfBookService,
  listBooksService,
  deleteShelfBookService,
  checkExistBookService,
} from "#src/services/shelf-books.service.ts";
import { ShelfStatus } from "#generated/prisma/client.ts";

export async function listBooks(req: Request, res: Response): Promise<void> {
  const data: ListBooksDTO = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    status: req.query.status as ShelfStatus | undefined,
  };

  const response = await listBooksService(data);

  res.status(200).json(response);
}

export async function updateShelfBook(
  req: Request,
  res: Response,
): Promise<void> {
  const data: UpdateShelfBookDTO = {
    id: Number(req.body.book_id),
    status: req.body.status,
    current_page: req.body.current_page,
    rating: req.body.rating,
    note: req.body.note,
    description: req.body.description,
  };

  const response = await updateShelfBookService(data);

  res.status(200).json({
    message: "Cập nhật sách thành công",
    book: response,
  });
}

export async function deleteBook(req: Request, res: Response): Promise<void> {
  const data: DeleteBookDTO = {
    id: Number(req.body.book_id),
  };

  const response = await deleteShelfBookService(data.id);

  res.status(200).json({
    message: "Xóa sách thành công",
    book: response,
  });
}

export async function checkExistBook(
  req: Request,
  res: Response,
): Promise<void> {
  const data: CheckExistBookDTO = {
    key: req.body.key,
  };

  const response = await checkExistBookService(data.key);

  console.log(response)

  res.status(200).json(response);
}
