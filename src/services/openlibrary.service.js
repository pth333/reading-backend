import { badGateway } from "#src/lib/http-error.js";

const BASE_URL = "https://openlibrary.org";
const COVER_URL = "https://covers.openlibrary.org/b/id";
const USER_AGENT = "reading-tracker-backend/1.0";
const REQUEST_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;

const FIELDS = [
  "key",
  "title",
  "author_name",
  "cover_i",
  "first_publish_year",
  "number_of_pages_median",
];

const cache = new Map();

function readCache(key) {
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

function writeCache(key, value) {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    cache.delete(cache.keys().next().value);
  }

  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function fetchSearchJson(url) {
  const cached = readCache(url);

  if (cached !== undefined) {
    return cached;
  }

  let response;

  try {
    response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const reason =
      error.name === "TimeoutError" ? "quá thời gian chờ" : error.message;
    throw badGateway(`Không gọi được Open Library (${reason})`);
  }

  if (!response.ok) {
    throw badGateway(`Open Library trả về HTTP ${response.status}`);
  }

  const data = await response.json();
  writeCache(url, data);

  return data;
}

export async function searchBooks({ params }) {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.title) searchParams.set("title", params.title);
  if (params.author) searchParams.set("author", params.author);
  FIELDS.forEach((f) => searchParams.append("fields", f));

  const url = `${BASE_URL}/search.json?${searchParams}`;

  const data = await fetchSearchJson(url);

  const items = await Promise.all(
    (data.docs ?? []).map(async (item) => ({
      ...item,
      cover_url: item.cover_i ? await getCoverImage(item.cover_i) : null,
    })),
  );

  return { total: data?.numFound ?? 0, items };
}

export async function getBookDetailService(work_id) {
  const url = `${BASE_URL}${work_id}.json`;
  const data = await fetchSearchJson(url);
  return data;
}

async function getCoverImage(cover_id, size = "M") {
  const url = `${COVER_URL}/${cover_id}-${size}.jpg`;

  // HEAD để lấy content-type mà không phải tải cả ảnh về.
  const response = await fetch(url, {
    method: "HEAD",
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    return null;
  }

  // Bìa thiếu vẫn trả HTTP 200 kèm GIF 1x1, nên status không dùng được.
  // Phải xem content-type: bìa thật là image/jpeg.
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.startsWith("image/") || contentType.includes("gif")) {
    return null;
  }

  return url;
}
