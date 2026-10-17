export const FIELDS = [
  "key",
  "title",
  "author_name",
  "cover_i",
  "first_publish_year",
  "number_of_pages_median",
];

export type OpenLibraryDoc = {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  number_of_pages_median?: number;
};

export type SearchResultItem = OpenLibraryDoc & { cover_url: string | null };

export type SearchResult = {
  total: number;
  items: SearchResultItem[];
};

export type OpenLibrarySearchResponse = {
  numFound?: number;
  docs?: OpenLibraryDoc[];
};

export type CacheEntry = { value: OpenLibrarySearchResponse; expiresAt: number };

export type SearchDTO = {
  title: string | undefined;
  author: string | undefined;
  page: number;
  limit: number;
};
