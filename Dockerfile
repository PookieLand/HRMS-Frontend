# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Accept build arguments for Asgardeo configuration
ARG VITE_CLIENT_ID=""
ARG VITE_ORG_BASE_URL=""

# Set environment variables for build
ENV VITE_CLIENT_ID=${VITE_CLIENT_ID}
ENV VITE_ORG_BASE_URL=${VITE_ORG_BASE_URL}

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install serve to run the production build
RUN npm install -g serve

# Copy built application from builder with proper ownership
COPY --from=builder --chown=node:node /app/dist ./dist

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"]
