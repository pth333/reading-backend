import { badGateway } from "#src/lib/http-error.ts";
import { FIELDS } from "#src/dtos/search.dto.ts";
import type {
  CacheEntry,
  OpenLibrarySearchResponse,
  SearchDTO,
  SearchResult,
  SearchResultItem,
} from "#src/dtos/search.dto.ts";

const BASE_URL = "https://openlibrary.org";
const COVER_URL = "https://covers.openlibrary.org/b/id";
const USER_AGENT = "reading-tracker-backend/1.0";
const REQUEST_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;

const cache = new Map<string, CacheEntry>();

function readCache(key: string): OpenLibrarySearchResponse | undefined {
  const entry = cache.get(key);

  if (!entry) {
    return undefined;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }

  return entry.value;
}

function writeCache(key: string, value: OpenLibrarySearchResponse): void {
  const oldest = cache.keys().next().value;

  if (cache.size >= CACHE_MAX_ENTRIES && oldest !== undefined) {
    cache.delete(oldest);
  }

  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function fetchOpenLibraryJson<T>(url: string): Promise<T> {
  const cached = readCache(url) as T | undefined;

  if (cached !== undefined) {
    return cached;
  }

  let response: Response;

  try {
    response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const reason =
      error instanceof Error && error.name === "TimeoutError"
        ? "quá thời gian chờ"
        : error instanceof Error
          ? error.message
          : String(error);
    throw badGateway(`Không gọi được Open Library (${reason})`);
  }

  if (!response.ok) {
    throw badGateway(`Open Library trả về HTTP ${response.status}`);
  }

  const data = (await response.json()) as T;
  writeCache(url, data as OpenLibrarySearchResponse);

  return data;
}

export async function searchBooks({
  params,
}: {
  params: SearchDTO;
}): Promise<SearchResult> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.title) searchParams.set("title", params.title);
  if (params.author_name) searchParams.set("author", params.author_name);
  FIELDS.forEach((f) => searchParams.append("fields", f));

  const url = `${BASE_URL}/search.json?${searchParams}`;

  const data = await fetchOpenLibraryJson<OpenLibrarySearchResponse>(url);

  const items: SearchResultItem[] = (data.docs ?? []).map((item) => ({
    ...item,
    cover_url: item.cover_i ? `${COVER_URL}/${item.cover_i}-M.jpg` : null,
  }));

  return { total: data.numFound ?? 0, items };
}

export async function getBookDetailService(workId: string): Promise<unknown> {
  const url = `${BASE_URL}${workId}.json`;
  const data = await fetchOpenLibraryJson<unknown>(url);
  return data;
}
