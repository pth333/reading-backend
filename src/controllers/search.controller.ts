import type { Request, Response } from "express";

import type { SearchDTO } from "#src/dtos/search.dto.ts";
import { searchBooks } from "#src/services/openlibrary.service.ts";

export async function search(req: Request, res: Response): Promise<void> {
  const params: SearchDTO = {
    title: req.query.title as string | undefined,
    author_name: req.query.author_name as string | undefined,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
  };

  const { total, items } = await searchBooks({ params });

  res.status(200).json({ total, items, page: params.page, limit: params.limit });
}
