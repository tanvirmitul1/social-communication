# ==============================================================================
# Build Stage - Build the application
# ==============================================================================
FROM node:20-alpine3.17 AS builder

# Install pnpm
RUN npm install -g pnpm@latest

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install ALL dependencies (including devDependencies for building)
RUN pnpm install --frozen-lockfile

# Copy source code and configuration
COPY . .

# Generate Prisma client
RUN pnpm prisma:generate

# Build application
RUN pnpm build

# ==============================================================================
# Production Stage - Run the application
# ==============================================================================
FROM node:20-alpine3.17

# Install pnpm
RUN npm install -g pnpm@latest

# Install required dependencies for Prisma on Alpine
# openssl1.1-compat provides libssl.so.1.1 needed by Prisma
RUN apk add --no-cache dumb-init openssl1.1-compat

# Create app user for security (don't run as root)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY --chown=nodejs:nodejs package.json pnpm-lock.yaml* ./

# Copy prisma schema
COPY --chown=nodejs:nodejs prisma ./prisma

# Install ONLY production dependencies
RUN pnpm install --frozen-lockfile --prod

# Install Prisma CLI separately (needed for generating client)
RUN pnpm add -D prisma

# Generate Prisma client
RUN pnpm prisma:generate

# Copy built application from builder stage
COPY --chown=nodejs:nodejs --from=builder /app/dist ./dist

# Copy docker entrypoint script
COPY --chown=nodejs:nodejs docker-entrypoint.sh ./

# Make entrypoint script executable
USER root
RUN chmod +x docker-entrypoint.sh

# Create necessary directories with proper permissions
RUN mkdir -p uploads logs && \
    chown -R nodejs:nodejs uploads logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run migrations and start application
CMD ["sh", "docker-entrypoint.sh"]
