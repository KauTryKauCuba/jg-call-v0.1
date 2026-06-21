FROM node:20-alpine

WORKDIR /app

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3110
ENV HOSTNAME="0.0.0.0"

# Install production dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source code
COPY . .

# Build the Next.js application
RUN npm run build

# Prune development dependencies to keep container size optimized
RUN npm prune --production

# Expose the configured port
EXPOSE 3110

# Run Next.js production server
CMD ["npx", "next", "start", "-p", "3110"]
