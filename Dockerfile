ARG NODE_VERSION=22-alpine

# 1) deps — cài toàn bộ dependency (dev + prod) theo package-lock.json
FROM node:${NODE_VERSION} AS deps

# Prisma CLI / schema engine trên Alpine cần OpenSSL có mặt trong PATH.
RUN apk add --no-cache openssl

WORKDIR /app

ENV NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_AUDIT=false

# Copy riêng manifest trước để tận dụng layer cache: sửa source không phải cài lại.
COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci

# 2) build — sinh Prisma Client + typecheck
FROM deps AS build

WORKDIR /app

COPY tsconfig.json prisma7.config.ts ./
COPY prisma ./prisma

# `prisma generate` không kết nối DB và không cần DATABASE_URL (đã test với Prisma 7.10).
# Sinh Prisma Client vào ./generated/prisma (đúng như npm run db:generate ở local).
RUN npm run db:generate

COPY src ./src

# Chặn build nếu TypeScript có lỗi (generated/ phải tồn tại trước bước này).
RUN npm run typecheck

# 3) migrate — image dùng một lần để chạy `prisma migrate deploy`
FROM build AS migrate

WORKDIR /app

ENV NODE_ENV=production

# DATABASE_URL do docker compose truyền vào lúc run; `import "dotenv/config"`
# trong prisma7.config.ts không override biến môi trường đã có sẵn.
CMD ["npm", "run", "db:deploy"]

# 4) prod-deps — bỏ devDependencies khỏi node_modules
FROM build AS prod-deps

WORKDIR /app

RUN npm prune --omit=dev && npm cache clean --force

# 5) runtime — image cuối, chỉ chứa những gì cần để chạy API
FROM node:${NODE_VERSION} AS runtime

WORKDIR /app

# NODE_ENV=production: error handler ẩn field `detail` trong response lỗi.
ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0

# package.json là bắt buộc: chứa "type": "module" và map subpath import
# (#src/*, #generated/*) mà Node dùng để resolve khi chạy .ts trực tiếp.
COPY --from=prod-deps --chown=node:node /app/package.json ./
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/generated ./generated
COPY --from=build --chown=node:node /app/src ./src

USER node

EXPOSE 8080

# Healthcheck = gọi 1 endpoint có truy vấn DB => kiểm tra cả server và kết nối database.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/shelf-books/list').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Chạy thẳng file TS (Node >= 22.18 type stripping). Env do Docker/compose cấp,
# không dùng --env-file-if-exists của npm script.
CMD ["node", "src/server.ts"]
