FROM oven/bun:1.3

WORKDIR /app

COPY bun.lock* package.json tsconfig.json ./
COPY index.ts ./
COPY src ./src
COPY static ./static
COPY docs ./docs

RUN bun install
RUN bun run build:client

EXPOSE 3000

ENV PORT=3000

CMD ["bun", "run", "index.ts"]
