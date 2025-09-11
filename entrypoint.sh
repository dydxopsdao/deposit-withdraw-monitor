#!/bin/bash

# Start Xvfb in the background
echo "Starting Xvfb..."
Xvfb :99 -screen 0 1280x720x24 -ac +extension GLX +render -noreset &
export DISPLAY=:99

# Wait for Xvfb to be ready
sleep 2

# Execute the command passed to the script
echo "Running Playwright tests..."
"$@"

# Capture the exit code of the tests
TEST_EXIT_CODE=$?

# Post-test actions
echo "Tests completed with exit code: $TEST_EXIT_CODE"

# Upload the report to S3
S3_PATH=$AWS_REPORTS_BUCKET_NAME/$ROUTE_ID/$(date +"%Y-%m-%d_%H-%M-%S")/
echo "Uploading report to S3: $S3_PATH"
aws s3 cp playwright-report/ s3://$S3_PATH --recursive
echo "Report uploaded"

# Exit with the same code as the tests
exit $TEST_EXIT_CODE