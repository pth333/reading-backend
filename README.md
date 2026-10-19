# Reading Tracker — Backend

REST API quản lý tủ sách cá nhân: tìm sách qua **Open Library**, lưu vào tủ, cập nhật tiến độ đọc, đánh giá, ghi chú. Ứng dụng 1 người dùng — không auth, không bảng `User`.

## Link demo

| | URL |
| --- | --- |
| Frontend (Netlify) | https://reading-traker.netlify.app |
| Backend |  https://reading-api.duckdns.org/api


## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Runtime | Node.js ≥ 22.18 (chạy `.ts` trực tiếp — **không build**) |
| Ngôn ngữ | TypeScript 7 (`strict`), ESM + subpath import `#src/*`, `#generated/*` |
| Web | Express 5 (tự catch async error), CORS |
| ORM / DB | Prisma 7 (Rust-free) + `@prisma/adapter-mariadb` → MariaDB 10.4 (`utf8mb4`, `+07:00`) |
| Ngoài | Open Library API (`openlibrary.org`), cache in-memory TTL 10 phút |
| Deploy | Docker multi-stage + Docker Compose |

## Chạy local

```bash
docker compose up -d          # MariaDB 10.4, port host 3308
cp .env.example .env          # DATABASE_URL="mysql://root:1111@localhost:3308/reading_tracker"
npm install
npm run db:generate           # sinh Prisma Client vào generated/ (gitignored)
npm run db:migrate            # tạo schema
npm run dev                   # http://localhost:8080 (auto-reload)
```

| Script | Việc |
| --- | --- |
| `npm run dev` / `npm start` | chạy server (port 8080) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` · `db:migrate` · `db:deploy` · `db:studio` | Prisma |

| Env | Mặc định | Ý nghĩa |
| --- | --- | --- |
| `DATABASE_URL` | — (**bắt buộc**) | chuỗi kết nối MySQL |
| `PORT` / `HOST` | `8080` / `::` | bind server |
| `NODE_ENV` | — | `production` → ẩn field `detail` trong lỗi |

Smoke test: `curl "http://localhost:8080/api/search?title=dune&limit=3"`

## Kiến trúc

```
routes/*.routes.ts  →  controllers  →  services  →  Prisma(adapter)  →  MariaDB
 (auto-mount /<tên file>)   (map HTTP↔DTO)   (nghiệp vụ)         ↘ Open Library + cache
```

- **Auto-loader**: `src/routes/index.ts` đọc mọi file `*.routes.ts`, mount theo tên file → thêm endpoint chỉ cần thêm file.
- **Không validation layer**: controller ép kiểu tay (`Number(...)`); service ném `HttpError` (400/404/409/502), middleware cuối map `P2002→409`, `P2025→404`, upstream lỗi `→502`.
- **CORS hard-code** origin trong `src/app.ts` (đổi domain phải sửa code).
- `books.service` (thêm sách) và `shelf-books.service` (list/update/delete) là nơi duy nhất chạm DB; rule nghiệp vụ: `read` ⇒ `current_page = total_pages`, `0 < current_page < total_pages` ⇒ `reading`, `reading` ⇒ set `started_at`.

### Sơ đồ database (1 bảng)

```mermaid
erDiagram
    SHELF_BOOKS {
        int      id                PK
        varchar  key               UK "work key Open Library (32)"
        varchar  title                "255"
        varchar  author_name          "500, nullable"
        int      cover_i              "nullable"
        smallint first_publish_year   "nullable"
        int      total_pages          "nullable"
        enum     status               "want|reading|read (default want)"
        int      current_page         "default 0"
        tinyint  rating               "1..5 (CHECK), nullable"
        varchar  note                 "500, nullable"
        text     description          "nullable"
        datetime started_at           "nullable"
        datetime finished_at          "nullable"
        datetime created_at           "sort DESC"
        datetime updated_at           "auto ON UPDATE"
    }
```

UNIQUE `key` = khoá chống trùng sách; `CHECK (rating BETWEEN 1 AND 5)` khai báo bằng `ALTER TABLE` trong migration (Prisma không hỗ trợ CHECK).

## API

**Base:** `http://localhost:8080/api` · JSON · không auth · chưa có Swagger/Postman collection.

| Method | Path | Mô tả |
| --- | --- | --- |
| `GET` | `/search?title=&author_name=&page=1&limit=10` | Tìm trên Open Library (`total`, `items`, `cover_url`) |
| `GET` | `/books/detail?key=/works/OL...W` | Chi tiết work (raw JSON từ Open Library) |
| `POST` | `/books/add` | Thêm vào tủ: `key,title,author_name,cover_i,first_publish_year,number_of_pages_median,status,description` → `201`, `409` nếu trùng |
| `GET` | `/shelf-books/list?page=1&limit=20&status=` | `{ items, stats:{total,reading,read} }`, sort `created_at DESC` |
| `POST` | `/shelf-books/update` | `book_id` + `status,current_page,rating,note,description` → `200 {message,book}` |
| `DELETE` | `/shelf-books/delete` | body `{ book_id }` → `200 {message,book}` |
| `POST` | `/shelf-books/check-exist-book` | body `{ key }` → `ShelfBook` hoặc `null` |

Lỗi: `400` sai dữ liệu · `404` không thấy sách · `409` trùng `key` · `500` DB · `502` Open Library timeout/lỗi.

```bash
curl -X POST localhost:8080/api/books/add -H "Content-Type: application/json" \
  -d '{"key":"/works/OL893415W","title":"Dune","author_name":["Frank Herbert"],"status":"reading"}'
```

## Cách deploy

| Thành phần | Nền tảng | Cấu hình |
| --- | --- | --- |
| Frontend | **Netlify** | build static/SPA, gọi API qua `VITE_*`/env base URL |
| Backend | **Docker Compose** trên VPS/host có Docker | image multi-stage, expose `8080` |
| Database | **MariaDB 10.4** (container, volume `mariadb_data`) | `utf8mb4`, `+07:00`, port host `${DB_PORT:-3308}` |

Các bước:

1. Clone repo lên server, tạo `.env` với `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `API_PORT`, `DB_PORT` (compose tự đọc `.env`).
2. `docker compose up -d --build` — build 5 stage (`deps → build → migrate/prod-deps → runtime`); `build` chạy `prisma generate` + `typecheck`, `runtime` chỉ chứa production deps + `generated/` + `src/`, chạy user `node`.
3. `migrate` (one-shot) chạy `prisma migrate deploy`; `api` chỉ start khi migrate exit 0 (`service_completed_successfully`) và MariaDB `healthy`.
4. Đưa API ra internet: reverse proxy (nginx/Caddy/Traefik) hoặc mapping port của platform, HTTPS bắt buộc vì FE gọi cross-origin.
5. Thêm domain frontend vào CORS trong `src/app.ts` (`origin: "http://localhost:8443,https://reading-traker.netlify.app"`) rồi `docker compose up -d --build api`.
6. Kiểm tra: `curl https://<backend-url>/api/shelf-books/list`.

`NODE_ENV=production` trong container ⇒ response lỗi không có field `detail`. Healthcheck gọi `/api/shelf-books/list` (có truy vấn DB) ⇒ DB chết thì container `unhealthy`.

## Giả định, hạn chế & hướng cải thiện

**Giả định**
- Mỗi sách định danh bằng `key` của Open Library (`/works/...`) → không thêm được sách không có trên Open Library.

**Hạn chế**
- Không có test (unit/integration) và không có validation schema (Zod/Joi) — dữ liệu sai kiểu chỉ phát hiện ở tầng DB.
- Không có Swagger/Postman collection; tài liệu API = bảng trong README.
- CORS hard-code trong code; cache Open Library in-memory (mất khi restart, không share giữa nhiều instance).
- Chưa có rate limit cho `/api/search` (phụ thuộc quota Open Library), chưa có `/health` riêng, chưa có CI/CD.

**Nếu có thêm thời gian**
1. Thêm `zod` validate request + `swagger-ui` (OpenAPI) tự sinh từ DTO.
2. Viết test (`vitest` + `supertest`) cho service/migration; CI GitHub Actions chạy `typecheck` + test.
3. Cache Redis cho Open Library, rate limit theo IP, thêm `/health` + `/metrics`.
