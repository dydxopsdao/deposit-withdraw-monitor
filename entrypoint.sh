#!/bin/bash

# Source the lock manager functions
source /scripts/lock-manager.sh

# Try to acquire lock before proceeding
if ! acquire_lock "$ROUTE_ID"; then
    echo "Another instance is already running for route: $ROUTE_ID"
    echo "Exiting gracefully to prevent duplicate execution"
    exit 0 # Exit with success code (not an error, just prevented duplicate)
fi

# Mark that we acquired the lock and ensure it's released on exit
export LOCK_ACQUIRED=true

# Trap all known signals to ensure cleanup_lock is called before exit.
# List of common signals: HUP INT QUIT ILL ABRT FPE KILL SEGV PIPE ALRM TERM USR1 USR2 CHLD CONT STOP TSTP TTIN TTOU
# Note: KILL and STOP cannot be trapped.
for sig in HUP INT QUIT ILL ABRT FPE SEGV PIPE ALRM TERM USR1 USR2 CHLD TSTP TTIN TTOU; do
  trap "echo \"Received SIG$sig\"; cleanup_lock; exit" "$sig"
done

# Start Xvfb in the background
echo "Starting Xvfb..."
Xvfb :99 -screen 0 1280x720x24 -ac +extension GLX +render -noreset &
export DISPLAY=:99

# Wait for Xvfb to be ready
sleep 2

# Set upload timestamp that will be used for S3 path and report URLs
export UPLOAD_TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
echo "Upload timestamp set to: $UPLOAD_TIMESTAMP"

# Execute the command passed to the script with timeout
echo "Running Playwright tests with ${TASK_TIMEOUT_SECONDS}s timeout..."
timeout "$TASK_TIMEOUT_SECONDS" "$@"

# Capture the exit code of the tests
TEST_EXIT_CODE=$?

# Post-test actions
echo "Tests completed with exit code: $TEST_EXIT_CODE"

# Upload the report to S3 using the same timestamp
S3_PATH=$AWS_REPORTS_BUCKET_NAME/$ROUTE_ID/$UPLOAD_TIMESTAMP/
echo "Uploading report to S3: $S3_PATH"
aws s3 cp playwright-report/ s3://$S3_PATH --recursive
echo "Done."

# Exit with the same code as the tests
exit $TEST_EXIT_CODE