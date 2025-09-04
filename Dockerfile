# Use official Node.js runtime as base image
FROM node:24-bookworm-slim

# Install system dependencies for Playwright, Chrome, and xvfb
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
    xvfb \
    xauth \
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
ENV DISPLAY=:99

# Expose any necessary ports (if needed)
# EXPOSE 3000
ENV FORCE_COLOR=0
#ENV DEBUG=pw:api

# Set the entrypoint to run tests in non-interactive mode with xvfb
CMD ["sh", "-c", \
  "echo 'Starting Xvfb'; \
  Xvfb :99 -screen 0 1280x720x24 -ac +extension GLX +render -noreset & ; \
  echo 'Running tests'; \
  exec stdbuf -oL -eL npx playwright test --reporter=line 2>&1"]