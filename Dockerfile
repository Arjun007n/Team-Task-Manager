# Build and run the full-stack app (API + Vite static assets)
FROM node:20-bookworm-slim AS base
WORKDIR /app

# sqlite3 is a native addon — keep toolchain for install
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "backend/index.js"]
