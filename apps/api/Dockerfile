ARG BUN_VERSION=1.2.7

FROM oven/bun:${BUN_VERSION} AS dev
WORKDIR /src

COPY bun.lock package.json tsconfig*.json ./
COPY apps/api/package.json apps/api/
COPY packages/*/package.json packages/*/

RUN --mount=type=cache,target=/root/.bun \
    bun install --no-progress

CMD ["bun", "run", "--cwd", "apps/api", "dev"]
