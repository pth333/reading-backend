import type { Request, Response } from "express";

import type {
  AddShelfBookPayload,
  GetBookDetailDTO,
} from "#src/dtos/books.dto.ts";
import { addBookShelfService } from "#src/services/books.service.ts";
import { getBookDetailService } from "#src/services/openlibrary.service.ts";

export async function addShelfBook(req: Request, res: Response): Promise<void> {

  const data: AddShelfBookPayload = {
    key: req.body.key,
    title: req.body.title,
    author_name: req.body.author_name,
    cover_i: req.body.cover_i,
    first_publish_year: req.body.first_publish_year,
    number_of_pages_median: req.body.number_of_pages_median,
    status: req.body.status,
  };

  const response = await addBookShelfService(data);
  res.status(201).json(response);
}

export async function getBookDetail(
  req: Request,
  res: Response,
): Promise<void> {
  const data: GetBookDetailDTO = {
    key: String(req.query.key),
  };

  const response = await getBookDetailService(data.key);
  res.status(200).json(response);
}
