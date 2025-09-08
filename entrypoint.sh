#!/bin/bash
set -e

# Start Xvfb in the background
echo "Starting Xvfb..."
Xvfb :99 -screen 0 1280x720x24 -ac +extension GLX +render -noreset &
export DISPLAY=:99

# Wait for Xvfb to be ready
# You can add a small sleep or a more sophisticated check here if needed
sleep 2

# Execute the command passed to the script
echo "Running Playwright tests..."
exec "$@"