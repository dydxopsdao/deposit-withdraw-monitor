#!/bin/bash

# Start Xvfb in the background
echo "Starting Xvfb..."
Xvfb :99 -screen 0 1280x720x24 -ac +extension GLX +render -noreset &
export DISPLAY=:99

# Wait for Xvfb to be ready
sleep 2

# Set upload timestamp that will be used for S3 path and report URLs
export UPLOAD_TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
echo "Upload timestamp set to: $UPLOAD_TIMESTAMP"

# Execute the command passed to the script
#echo "Running Playwright tests..."
#"$@"

echo "Running Playwright tests with UPLOAD_TIMESTAMP=$UPLOAD_TIMESTAMP..."
env UPLOAD_TIMESTAMP="$UPLOAD_TIMESTAMP" "$@"

# Capture the exit code of the tests
TEST_EXIT_CODE=$?

# Post-test actions
echo "Tests completed with exit code: $TEST_EXIT_CODE"

# Upload the report to S3 using the same timestamp
S3_PATH=$AWS_REPORTS_BUCKET_NAME/$ROUTE_ID/$UPLOAD_TIMESTAMP/
echo "Uploading report to S3: $S3_PATH"
aws s3 cp playwright-report/ s3://$S3_PATH --recursive
echo "Report uploaded to: $S3_PATH"

# Exit with the same code as the tests
exit $TEST_EXIT_CODE