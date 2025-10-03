FROM node:20-alpine AS base

# Install OpenSSL for Prisma and pnpm
RUN apk add --no-cache openssl && \
    npm install -g pnpm@8

FROM base AS deps
WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all workspace package.json files
COPY apps/backend/package.json ./apps/backend/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/compliance/package.json ./packages/compliance/

# Install dependencies
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/packages ./packages

# Copy source code
COPY apps/backend ./apps/backend
COPY packages ./packages
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Generate Prisma client
WORKDIR /app/packages/database
RUN pnpm prisma generate

# Build backend
WORKDIR /app/apps/backend
RUN pnpm build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy everything from builder (node_modules with all deps + Prisma client)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/package.json ./

# Expose port
EXPOSE 4000

# Set NODE_PATH to help resolve pnpm dependencies
ENV NODE_PATH=/app/node_modules/.pnpm/node_modules:/app/node_modules

# Start the application (maintain workspace structure)
WORKDIR /app/apps/backend
CMD ["node", "dist/apps/backend/src/main.js"]
