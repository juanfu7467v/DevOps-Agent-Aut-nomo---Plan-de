# Use Node.js 22 Alpine for a lightweight image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install necessary dependencies for some node modules
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./

# Install production dependencies only
# We use --package-lock-only to ensure consistency if needed, 
# but for a clean build we just do a regular install
RUN npm install --omit=dev

# Copy the rest of the application code
COPY . .

# Create logs directory
RUN mkdir -p ./src/logs

# Expose the port the app runs on
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "src/server.js"]
