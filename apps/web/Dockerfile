FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY apps/web/package.json ./
COPY pnpm-workspace.yaml ../
COPY package.json ../

# Install dependencies
RUN pnpm install

# Copy source code
COPY apps/web .

# Expose port
EXPOSE 3000

# Development server
CMD ["pnpm", "dev"]