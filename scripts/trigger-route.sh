#!/bin/bash

# Assumes you're logged in to AWS:
# aws sso login --sso-session dydxopsdao

# Default region
REGION="ap-northeast-1"  # Tokyo
DEBUG=false
ALL=false

# Function to print usage information
print_usage() {
    echo "Usage: $0 [--region=REGION] [--debug=true|false] [--all=true|false] [--help] [--list-routes] [<route-id> ...]"
    echo "  --region=REGION      AWS region (default: ap-northeast-1)"
    echo "  --all=true|false     Execute all available routes (default: false)"
    echo "  --debug=true|false   Show detailed JSON output (default: false)"
    echo "  --help               Show this help message and exit"
    echo "  --list-routes        List all available routes and exit"
    echo "  <route-id>           One or more route IDs to execute (ignored if --all=true)"
}

# Function to get all available route IDs
get_all_route_ids() {
    aws ecs list-task-definitions --region $REGION --query 'taskDefinitionArns[*]' --output text | awk '{for(i=1;i<=NF;i++) if($i ~ /task-definition/) {split($i,a,"/"); split(a[length(a)],b,":"); print b[1]}}'
}

# Function to run ECS task command
run_ecs_task_command() {
    local route_id="$1"
    
    aws ecs run-task \
      --region $REGION \
      --cluster deposit-withdraw-monitor-scheduled-jobs \
      --task-definition $route_id \
      --launch-type FARGATE \
      --platform-version 1.4.0 \
      --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_ID],securityGroups=[$SG_ID],assignPublicIp=DISABLED}"
}

# Function to check if user is authenticated with AWS
is_aws_authenticated() {
    aws sts get-caller-identity --region $REGION >/dev/null 2>&1
}

# Parse arguments
ROUTE_IDS=()
for arg in "$@"; do
    case $arg in
        --region=*)
            REGION="${arg#*=}"
            shift
            ;;
        --debug=*)
            DEBUG="${arg#*=}"
            shift
            ;;
        --all=*)
            ALL="${arg#*=}"
            shift
            ;;
        --help)
            print_usage
            exit 0
            ;;
        --list-routes)
            echo "Available routes:"
            if is_aws_authenticated; then
                get_all_route_ids
            else
                echo "Error: You are not logged into AWS or your credentials have expired."
                echo "Please run:"
                echo "  aws sso login --sso-session dydxopsdao"
                echo "or similar, depending on your SSO setup."
                exit 1
            fi
            exit 0
            ;;
        -*)
            echo "Unknown option: $arg"
            exit 1
            ;;
        *)
            ROUTE_IDS+=("$arg")
            ;;
    esac
done

# if no routes were provided and --all was not set, print the usage and exit
if [ ${#ROUTE_IDS[@]} -eq 0 ] && [ "$ALL" = "false" ]; then
    print_usage
    exit 1
fi

# Check for required dependencies
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed. Please install jq to use this script."
    exit 1
fi

# Check AWS authentication before attempting any AWS operations
if ! is_aws_authenticated; then
    echo "Error: You are not logged into AWS or your credentials have expired."
    echo "Please run:"
    echo "  aws sso login --sso-session dydxopsdao"
    echo "or similar, depending on your SSO setup."
    exit 1
fi

# If --all=true, fetch all routes; otherwise validate that routes were provided
if [ "$ALL" = "true" ]; then
    # Fetch all available routes
    ROUTE_IDS=($(get_all_route_ids))
    
    if [ ${#ROUTE_IDS[@]} -eq 0 ]; then
        echo "Error: No routes found in region $REGION"
        exit 1
    fi
elif [ ${#ROUTE_IDS[@]} -eq 0 ]; then
    print_usage
    exit 1
fi

# Select the private subnet (characterized by map-public-ip-on-launch=false)
SUBNET_ID=$(aws ec2 describe-subnets --region $REGION --filters "Name=tag:Name,Values=*deposit-withdraw-monitor*" "Name=map-public-ip-on-launch,Values=false" --query 'Subnets[0].SubnetId' --output text)

# Select the security group
SG_ID=$(aws ec2 describe-security-groups --region $REGION --filters "Name=group-name,Values=deposit-withdraw-monitor-*" --query 'SecurityGroups[0].GroupId' --output text)

if [ "$DEBUG" = "true" ]; then
    echo "Using region: $REGION"
    echo "Using subnet: $SUBNET_ID"
    echo "Using security group: $SG_ID"
fi

if [ "$ALL" = "true" ]; then
    echo "Triggering all ${#ROUTE_IDS[@]} available route(s)"
else
    echo "Triggering ${#ROUTE_IDS[@]} route(s)"
fi
echo

# Loop through all route IDs and execute each one
for ROUTE_ID in "${ROUTE_IDS[@]}"; do
    echo -n "Triggering: $ROUTE_ID... "
    
    # Capture the output from the ECS command and check exit status
    if output=$(run_ecs_task_command "$ROUTE_ID" 2>&1); then
        # Command succeeded, check for failures in the JSON response
        failures=$(echo "$output" | jq -r '.failures // empty | length' 2>/dev/null)
        
        if [ -n "$failures" ] && [ "$failures" -gt 0 ]; then
            echo "FAILED"
            echo "Failures for $ROUTE_ID:"
            echo "$output" | jq -r '.failures[]'
            echo
        else
            echo "ok."
            
            # Show full JSON output only in debug mode
            if [ "$DEBUG" = "true" ]; then
                echo "Full JSON output:"
                echo "$output"
                echo
            fi
        fi
    else
        # Command failed (non-zero exit status)
        echo "FAILED"
        echo "Error executing route $ROUTE_ID:"
        echo "$output"
        echo
    fi
done

echo
echo "All routes processed"
