import type { ShelfBook } from "#generated/prisma/client.ts";

export const STATUSES = ["want", "reading", "read"] as const;

export type ShelfStatus = (typeof STATUSES)[number];

export type ListBooksDTO = {
  page: number;
  limit: number;
  status?: ShelfStatus | undefined;
};

export type UpdateShelfBookDTO = {
  id: number;
  status?: ShelfStatus;
  current_page?: number;
  rating?: number | undefined;
  note?: string | null;
  description?: string | null;
  started_at?: Date | string;
  finished_at?: Date | string;
};

export type DeleteBookDTO = {
  id: number;
};

export type CheckExistBookDTO = {
  key: string;
};

export type ListBooksResult = {
  items: ShelfBook[];
  stats: {
    total: number;
    reading: number;
    read: number;
  };
};
