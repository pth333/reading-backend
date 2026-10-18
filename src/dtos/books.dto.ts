import type { ShelfStatus } from "./shelf-books.dto.ts";

export type OpenLibraryItem = {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  number_of_pages_median?: number;
};

export type AddShelfBookPayload = {
  key: string;
  title: string;
  author_name?: string[] | null;
  cover_i?: number;
  first_publish_year?: number;
  number_of_pages_median?: number;
  status?: ShelfStatus;
  description?: string;
  started_at?: Date | string;
  finished_at?: Date | string;
};

export type GetBookDetailDTO = {
  key: string;
};
