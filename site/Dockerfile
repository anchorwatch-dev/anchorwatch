FROM oven/bun:1-slim AS build
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production || bun install --production
COPY . .
RUN bun run build.ts

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY server.ts package.json ./
ENV PORT=8080 DATA_DIR=/data
RUN mkdir -p /data
EXPOSE 8080
CMD ["bun", "run", "server.ts"]
