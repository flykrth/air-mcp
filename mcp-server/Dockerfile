# Stage 1: Build dependency cache
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Compile TypeScript
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV MCP_TRANSPORT_TYPE=dual

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 mcpuser

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy compiled JS files
COPY --from=builder /app/dist ./dist

USER mcpuser
EXPOSE 3000

# Run index.js directly to avoid depending on devDependencies like @nitrostack/cli at runtime
CMD ["node", "dist/index.js"]
