# Use official Node.js runtime as base image
FROM node:24-bookworm-slim

# Install system dependencies for Playwright and Chrome
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libgtk-3-0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2 \
    fonts-liberation \
    libappindicator3-1 \
    xdg-utils \
    wget \
    ca-certificates \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies (including devDependencies for Playwright CLI)
RUN npm ci

# Install Playwright browsers
RUN npx playwright install chromium
RUN npx playwright install-deps chromium

# Copy application code
COPY . .

# Create directories for extensions and user data
RUN mkdir -p extensions user-data test-results

# Download required extensions
RUN npm run download-extensions

# Set environment variables for non-interactive mode
ENV CI=true
ENV NODE_ENV=production

# DEBUG
ENV ROUTE_ID="dep-ethereum-usdc-regular-metamask-10"

# Expose any necessary ports (if needed)
# EXPOSE 3000

# Set the entrypoint to run tests in non-interactive mode
CMD ["npx", "playwright", "test", "--reporter=line"]
