# Stage 1: Build Node.js MCP Server files
FROM node:20-slim AS mcp-builder
WORKDIR /mcp-server
COPY mcp-server/package.json mcp-server/package-lock.json ./
RUN npm ci
COPY mcp-server/ .
RUN npm run build
# Clean devDependencies to minimize image size
RUN rm -rf node_modules && npm ci --only=production

# Stage 2: Final Backend Container (Python + Node.js runtimes)
FROM python:3.11-slim
WORKDIR /app

# Install Node.js runtime so Python subprocess stdio can execute 'node'
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy FastAPI backend code
COPY backend/app ./app

# Copy pre-compiled MCP server files to the container
COPY --from=mcp-builder /mcp-server /app/mcp-server

# Configure environment variables
# Tell the backend where the MCP server is located
ENV MCP_SERVER_DIR=/app/mcp-server
ENV PORT=8000
ENV HOST=0.0.0.0

# Create a non-privileged user and group for runtime execution
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -m appuser && \
    chown -R appuser:appgroup /app

USER appuser
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
