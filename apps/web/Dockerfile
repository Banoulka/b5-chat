ARG BUN_VERSION=1.2.7

FROM oven/bun:${BUN_VERSION} AS base
WORKDIR /src

COPY bun.lock package.json tsconfig*.json ./
COPY apps/web/package.json apps/web/
COPY packages/*/package.json packages/*/

RUN --mount=type=cache,target=/root/.bun \
    bun install --no-progress

FROM base AS dev
ENV NODE_ENV=development
CMD ["bun", "x", "run", "--cwd", "apps/web", "dev"]


