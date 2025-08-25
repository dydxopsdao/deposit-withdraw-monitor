#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Building and pushing Docker image to ECR${NC}"

# Set region to ap-northeast-1 if the variable is not set already
AWS_REGION="${AWS_REGION:-ap-northeast-1}"
echo -e "${GREEN}✅ AWS Region: ${AWS_REGION}${NC}"

# Check if we're in the right directory
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}❌ Error: Dockerfile not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ Error: AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if we have AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Error: AWS credentials not configured or expired. Please run 'aws sso login --sso-session dydxopsdao'${NC}"
    exit 1
fi

# Get ECR repository URL by name
echo -e "${YELLOW}📋 Getting ECR repository URL by name in ${AWS_REGION}...${NC}"
ECR_URL=$(aws ecr describe-repositories --repository-names deposit-withdraw-monitor --region ${AWS_REGION} --query 'repositories[0].repositoryUri' --output text 2>/dev/null)
if [ $? -ne 0 ] || [ -z "$ECR_URL" ]; then
    echo -e "${RED}❌ Error: Could not get ECR repository URL by name in ${AWS_REGION} in the current AWS account.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ ECR Repository URL: ${ECR_URL}${NC}"

# Login to ECR
echo -e "${YELLOW}🔐 Logging into ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin $ECR_URL

# Build Docker image
echo -e "${YELLOW}🔨 Building Docker image...${NC}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
IMAGE_TAG="v${TIMESTAMP}"

docker build --platform linux/amd64 -t deposit-withdraw-monitor:$IMAGE_TAG .
docker build --platform linux/amd64 -t deposit-withdraw-monitor:latest .

# Tag images for ECR
echo -e "${YELLOW}🏷️  Tagging images for ECR...${NC}"
docker tag deposit-withdraw-monitor:$IMAGE_TAG $ECR_URL:$IMAGE_TAG
docker tag deposit-withdraw-monitor:latest $ECR_URL:latest

# Push images to ECR
echo -e "${YELLOW}📤 Pushing images to ECR...${NC}"
docker push $ECR_URL:$IMAGE_TAG
docker push $ECR_URL:latest

echo -e "${GREEN}🎉 Successfully built and pushed Docker image!${NC}"
echo -e "${GREEN}📋 Image URL: ${ECR_URL}:latest${NC}"
echo -e "${GREEN}📋 Tagged version: ${ECR_URL}:${IMAGE_TAG}${NC}"

# Clean up local images
echo -e "${YELLOW}🧹 Cleaning up local Docker images...${NC}"
docker rmi deposit-withdraw-monitor:$IMAGE_TAG deposit-withdraw-monitor:latest || true
echo -e "${GREEN}✅ Local images cleaned up${NC}"

echo -e "${GREEN}✨ Build and push completed successfully!${NC}"
