import type { Request, Response } from "express";

import type {
  DeleteBookDTO,
  ListBooksDTO,
  UpdateShelfBookDTO,
} from "#src/dtos/shelf-books.dto.ts";
import {
  updateShelfBookService,
  listBooksService,
  deleteShelfBookService,
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
  };

  if (
    data.current_page &&
    data.current_page < 0 &&
    data.current_page > req.body.total_page
  ) {
    throw new Error(
      "Số trang đang đọc phải lớn hơn 0 hoặc nhỏ hơn tổng số trang",
    );
  } else if (data.current_page === req.body.total_page) {
    data.status = ShelfStatus.read;
  }

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
