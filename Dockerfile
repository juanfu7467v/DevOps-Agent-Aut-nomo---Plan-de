# Use Node.js 22 Alpine for a lightweight image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install necessary dependencies for Puppeteer and system compatibility
# We add chromium and its dependencies to avoid downloading it via npm
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    libc6-compat

# Tell Puppeteer to skip downloading Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files
COPY package*.json ./

# Install production dependencies only
# Using --no-audit and --no-fund to speed up and avoid hangs
RUN npm install --omit=dev --no-audit --no-fund

# Copy the rest of the application code
COPY . .

# Create logs directory
RUN mkdir -p ./src/logs

# Expose the port the app runs on
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production \
    PORT=3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "src/server.js"]
