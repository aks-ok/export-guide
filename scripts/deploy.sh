#!/bin/bash

# ExportRight Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Environments: development, staging, production

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-development}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
validate_environment() {
    case $ENVIRONMENT in
        development|staging|production)
            log_info "Deploying to $ENVIRONMENT environment"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            log_info "Valid environments: development, staging, production"
            exit 1
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check environment file
    ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"
    if [ ! -f "$ENV_FILE" ]; then
        log_warning "Environment file not found: $ENV_FILE"
        log_info "Using .env.example as template"
        cp "$PROJECT_ROOT/.env.example" "$ENV_FILE"
    fi
    
    log_success "Prerequisites check completed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    cd "$PROJECT_ROOT"
    npm ci
    log_success "Dependencies installed"
}

# Run tests
run_tests() {
    log_info "Running tests..."
    cd "$PROJECT_ROOT"
    
    # Run linting
    log_info "Running linting..."
    npm run lint
    
    # Run type checking
    log_info "Running type checking..."
    npm run type-check
    
    # Run unit tests
    log_info "Running unit tests..."
    npm test -- --coverage --watchAll=false
    
    # Run integration tests
    log_info "Running integration tests..."
    npm run test:integration
    
    log_success "All tests passed"
}

# Build application
build_application() {
    log_info "Building application for $ENVIRONMENT..."
    cd "$PROJECT_ROOT"
    
    # Set environment variables
    export NODE_ENV=$ENVIRONMENT
    if [ -f ".env.$ENVIRONMENT" ]; then
        export $(cat ".env.$ENVIRONMENT" | grep -v '^#' | xargs)
    fi
    
    # Build
    npm run build
    
    log_success "Application built successfully"
}

# Deploy to development
deploy_development() {
    log_info "Starting development server..."
    cd "$PROJECT_ROOT"
    npm start
}

# Deploy to staging
deploy_staging() {
    log_info "Deploying to staging..."
    
    # Build Docker image
    log_info "Building Docker image..."
    cd "$PROJECT_ROOT"
    docker build -t exportright:staging .
    
    # Deploy with Docker Compose
    log_info "Deploying with Docker Compose..."
    docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
    
    log_success "Deployed to staging"
}

# Deploy to production
deploy_production() {
    log_info "Deploying to production..."
    
    # Confirm production deployment
    read -p "Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log_info "Production deployment cancelled"
        exit 0
    fi
    
    # Deploy based on configuration
    if [ -n "$VERCEL_TOKEN" ]; then
        deploy_vercel
    elif [ -n "$AWS_ACCESS_KEY_ID" ]; then
        deploy_aws
    else
        deploy_docker_production
    fi
}

# Deploy to Vercel
deploy_vercel() {
    log_info "Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        log_info "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    vercel --prod
    log_success "Deployed to Vercel"
}

# Deploy to AWS
deploy_aws() {
    log_info "Deploying to AWS..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Upload to S3
    log_info "Uploading to S3..."
    aws s3 sync build/ "s3://$S3_BUCKET" --delete
    
    # Invalidate CloudFront
    if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
        log_info "Invalidating CloudFront cache..."
        aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*"
    fi
    
    log_success "Deployed to AWS"
}

# Deploy with Docker to production
deploy_docker_production() {
    log_info "Deploying with Docker to production..."
    
    # Build production image
    log_info "Building production Docker image..."
    cd "$PROJECT_ROOT"
    docker build -t exportright:production .
    
    # Deploy with Docker Compose
    log_info "Deploying with Docker Compose..."
    docker-compose -f docker-compose.yml -f docker-compose.production.yml up -d
    
    log_success "Deployed to production with Docker"
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    case $ENVIRONMENT in
        development)
            URL="http://localhost:3000"
            ;;
        staging)
            URL="http://localhost:80"
            ;;
        production)
            URL="${PRODUCTION_URL:-http://localhost:80}"
            ;;
    esac
    
    # Wait for application to start
    sleep 10
    
    # Check if application is responding
    if curl -f -s "$URL/health" > /dev/null 2>&1; then
        log_success "Health check passed - Application is running"
    else
        log_warning "Health check failed - Application may not be fully ready"
    fi
}

# Cleanup
cleanup() {
    log_info "Cleaning up..."
    
    # Remove temporary files
    rm -rf "$PROJECT_ROOT/build" 2>/dev/null || true
    
    log_success "Cleanup completed"
}

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."
    
    case $ENVIRONMENT in
        staging|production)
            # Stop current containers
            docker-compose down
            
            # Start previous version (if available)
            if docker images | grep -q "exportright:previous"; then
                docker tag exportright:previous exportright:$ENVIRONMENT
                docker-compose up -d
                log_success "Rollback completed"
            else
                log_error "No previous version available for rollback"
            fi
            ;;
        *)
            log_info "Rollback not applicable for $ENVIRONMENT"
            ;;
    esac
}

# Main deployment function
main() {
    log_info "Starting ExportRight deployment..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Timestamp: $(date)"
    
    # Trap errors and cleanup
    trap 'log_error "Deployment failed"; cleanup; exit 1' ERR
    trap 'log_info "Deployment interrupted"; cleanup; exit 1' INT
    
    validate_environment
    check_prerequisites
    install_dependencies
    
    # Skip tests in development mode for faster iteration
    if [ "$ENVIRONMENT" != "development" ]; then
        run_tests
    fi
    
    build_application
    
    # Deploy based on environment
    case $ENVIRONMENT in
        development)
            deploy_development
            ;;
        staging)
            deploy_staging
            health_check
            ;;
        production)
            deploy_production
            health_check
            ;;
    esac
    
    log_success "Deployment completed successfully!"
    log_info "Environment: $ENVIRONMENT"
    log_info "Timestamp: $(date)"
}

# Handle script arguments
case "${1:-}" in
    --rollback)
        rollback
        exit 0
        ;;
    --cleanup)
        cleanup
        exit 0
        ;;
    --help|-h)
        echo "ExportRight Deployment Script"
        echo ""
        echo "Usage: $0 [environment] [options]"
        echo ""
        echo "Environments:"
        echo "  development  - Start development server"
        echo "  staging      - Deploy to staging environment"
        echo "  production   - Deploy to production environment"
        echo ""
        echo "Options:"
        echo "  --rollback   - Rollback to previous version"
        echo "  --cleanup    - Clean up temporary files"
        echo "  --help, -h   - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 development"
        echo "  $0 staging"
        echo "  $0 production"
        echo "  $0 --rollback"
        exit 0
        ;;
esac

# Run main function
main