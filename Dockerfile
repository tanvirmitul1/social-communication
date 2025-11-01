# ==============================================================================
# Build Stage - Build the application
# ==============================================================================
FROM node:20-alpine AS builder

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
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm@latest

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

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

# Generate Prisma client
RUN pnpm prisma:generate

# Copy built application from builder stage
COPY --chown=nodejs:nodejs --from=builder /app/dist ./dist

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

# Start application
CMD ["node", "dist/main.js"]
