#!/bin/bash

# Lock management functions for DynamoDB-based distributed locking
# Required environment variables:
#   - ROUTE_ID: Unique identifier for the route
#   - DYNAMODB_LOCKS_TABLE_NAME: DynamoDB table name
#   - AWS_REGION: AWS region

set -e

LOCK_TIMEOUT_SECONDS=3600 # Lock expires after 1 hour (safety mechanism)
TASK_ARN="${ECS_CONTAINER_METADATA_URI_V4}" # ECS task metadata for unique ID

# Acquire lock in DynamoDB
# Returns 0 if lock acquired, 1 if lock is held by another task
acquire_lock() {
    local route_id="$1"
    local current_time=$(date +%s)
    local lock_expiry=$((current_time + LOCK_TIMEOUT_SECONDS))
    local ttl=$((lock_expiry + 86400)) # TTL set to 24 hours after expiry for cleanup

    echo "Attempting to acquire lock for route: $route_id"

    # Try to acquire lock using conditional PutItem
    # Condition: lock doesn't exist OR lock is expired
    set +e # Don't exit on error
    aws dynamodb put-item \
        --table-name "$DYNAMODB_LOCKS_TABLE_NAME" \
        --item "{
            \"route_id\": {\"S\": \"$route_id\"},
            \"locked_at\": {\"N\": \"$current_time\"},
            \"locked_by\": {\"S\": \"$TASK_ARN\"},
            \"lock_expiry\": {\"N\": \"$lock_expiry\"},
            \"ttl\": {\"N\": \"$ttl\"}
        }" \
        --condition-expression "attribute_not_exists(route_id) OR lock_expiry < :now" \
        --expression-attribute-values "{\":now\": {\"N\": \"$current_time\"}}" \
        --region "$AWS_REGION" \
        2>&1

    local result=$?
    set -e

    if [ $result -eq 0 ]; then
        echo "Lock acquired successfully for route: $route_id"
        return 0
    else
        echo "Lock is held by another task for route: $route_id"
        return 1
    fi
}

# Release lock in DynamoDB
# Only releases if this task is the lock holder
release_lock() {
    local route_id="$1"

    echo "Releasing lock for route: $route_id"

    set +e # Don't exit on error
    aws dynamodb delete-item \
        --table-name "$DYNAMODB_LOCKS_TABLE_NAME" \
        --key "{\"route_id\": {\"S\": \"$route_id\"}}" \
        --condition-expression "locked_by = :task_arn" \
        --expression-attribute-values "{\":task_arn\": {\"S\": \"$TASK_ARN\"}}" \
        --region "$AWS_REGION" \
        2>&1

    local result=$?
    set -e

    if [ $result -eq 0 ]; then
        echo "Lock released successfully for route: $route_id"
    else
        echo "Warning: Failed to release lock (may have been taken by another task or expired)"
    fi
}

# Cleanup function to be called on exit
cleanup_lock() {
    if [ -n "$LOCK_ACQUIRED" ] && [ "$LOCK_ACQUIRED" = "true" ]; then
        release_lock "$ROUTE_ID"
    fi
}
