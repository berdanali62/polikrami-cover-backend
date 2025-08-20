# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci || npm install

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma
RUN npx prisma generate --schema=./prisma/schema.prisma && npm run build

FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S nodegrp && adduser -S nodeuser -G nodegrp
RUN apk add --no-cache curl
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY dist ./dist
COPY --from=build /app/prisma ./prisma
USER nodeuser
EXPOSE 3000
CMD ["node", "dist/index.js"]

