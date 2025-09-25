FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY apps/backend/package.json ./
COPY pnpm-workspace.yaml ../
COPY package.json ../

# Install dependencies
RUN pnpm install

# Copy source code
COPY apps/backend .
COPY packages ../packages

# Generate Prisma client
RUN pnpm prisma:generate

# Expose port
EXPOSE 3002

# Development server
CMD ["pnpm", "dev"]