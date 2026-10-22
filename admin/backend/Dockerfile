FROM oven/bun:1.4.4-alpine

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

COPY backend/ ./backend/
COPY src/lib/ ./src/lib/

ENV NODE_ENV=production
ENV CRM_BACKEND_PORT=3001

EXPOSE 3001

CMD ["bun", "backend/server.ts"]
