#!/bin/bash

# Production Deployment Script for HUNKCentral
# This script handles production deployment with proper checks and monitoring

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="hunkcentral-v2"
PRODUCTION_URL="https://hunkcentral.com"
HEALTH_CHECK_ENDPOINT="/api/health"
MAX_RETRIES=10
RETRY_DELAY=30

# Functions
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

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if required tools are installed
    command -v node >/dev/null 2>&1 || { log_error "Node.js is required but not installed. Aborting."; exit 1; }
    command -v npm >/dev/null 2>&1 || { log_error "npm is required but not installed. Aborting."; exit 1; }
    command -v vercel >/dev/null 2>&1 || { log_error "Vercel CLI is required but not installed. Run: npm install -g vercel"; exit 1; }
    command -v git >/dev/null 2>&1 || { log_error "Git is required but not installed. Aborting."; exit 1; }
    
    # Check if we're on the main branch
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" != "main" ]; then
        log_error "Production deployment must be done from the main branch. Current branch: $CURRENT_BRANCH"
        exit 1
    fi
    
    # Check if working directory is clean
    if [ -n "$(git status --porcelain)" ]; then
        log_error "Working directory is not clean. Please commit or stash your changes."
        exit 1
    fi
    
    # Check if required environment variables are set
    if [ -z "$VERCEL_TOKEN" ]; then
        log_error "VERCEL_TOKEN environment variable is required"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

run_pre_deployment_tests() {
    log_info "Running pre-deployment tests..."
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm ci
    
    # Generate Prisma client
    log_info "Generating Prisma client..."
    npx prisma generate
    
    # Run linting
    log_info "Running ESLint..."
    npm run lint
    
    # Run type checking
    log_info "Running TypeScript type checking..."
    npm run type-check
    
    # Run unit tests
    log_info "Running unit tests..."
    npm run test
    
    # Build the application
    log_info "Building application..."
    npm run build
    
    log_success "Pre-deployment tests passed"
}

deploy_to_vercel() {
    log_info "Deploying to Vercel production..."
    
    # Pull Vercel environment information
    log_info "Pulling Vercel environment information..."
    vercel pull --yes --environment=production --token="$VERCEL_TOKEN"
    
    # Build project artifacts
    log_info "Building project artifacts..."
    vercel build --prod --token="$VERCEL_TOKEN"
    
    # Deploy to production
    log_info "Deploying to production..."
    DEPLOYMENT_URL=$(vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN")
    
    if [ -z "$DEPLOYMENT_URL" ]; then
        log_error "Deployment failed - no URL returned"
        exit 1
    fi
    
    log_success "Deployment completed: $DEPLOYMENT_URL"
    echo "DEPLOYMENT_URL=$DEPLOYMENT_URL" >> $GITHUB_OUTPUT 2>/dev/null || true
}

wait_for_deployment() {
    log_info "Waiting for deployment to be ready..."
    
    local url="$1"
    local retries=0
    
    while [ $retries -lt $MAX_RETRIES ]; do
        log_info "Health check attempt $((retries + 1))/$MAX_RETRIES..."
        
        if curl -f -s "$url$HEALTH_CHECK_ENDPOINT" > /dev/null; then
            log_success "Deployment is healthy and ready"
            return 0
        fi
        
        retries=$((retries + 1))
        if [ $retries -lt $MAX_RETRIES ]; then
            log_warning "Health check failed, retrying in $RETRY_DELAY seconds..."
            sleep $RETRY_DELAY
        fi
    done
    
    log_error "Deployment health check failed after $MAX_RETRIES attempts"
    return 1
}

run_post_deployment_tests() {
    log_info "Running post-deployment tests..."
    
    local url="$1"
    
    # Test health endpoint
    log_info "Testing health endpoint..."
    HEALTH_RESPONSE=$(curl -s "$url$HEALTH_CHECK_ENDPOINT")
    HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$HEALTH_STATUS" != "healthy" ]; then
        log_error "Health check failed. Status: $HEALTH_STATUS"
        echo "Health response: $HEALTH_RESPONSE"
        return 1
    fi
    
    # Test critical endpoints
    log_info "Testing critical endpoints..."
    
    # Test login page
    if ! curl -f -s "$url/auth/login" > /dev/null; then
        log_error "Login page is not accessible"
        return 1
    fi
    
    # Test API endpoints
    if ! curl -f -s "$url/api/health" > /dev/null; then
        log_error "API health endpoint is not accessible"
        return 1
    fi
    
    log_success "Post-deployment tests passed"
}

run_performance_audit() {
    log_info "Running performance audit..."
    
    local url="$1"
    
    # Install Lighthouse CI if not already installed
    if ! command -v lhci >/dev/null 2>&1; then
        log_info "Installing Lighthouse CI..."
        npm install -g @lhci/cli@0.12.x
    fi
    
    # Create temporary Lighthouse config for production URL
    cat > lighthouserc.prod.js << EOF
module.exports = {
  ci: {
    collect: {
      url: [
        '$url',
        '$url/auth/login',
      ],
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
        onlyCategories: ['performance'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
      },
    },
  },
};
EOF
    
    # Run Lighthouse audit
    if lhci autorun --config=lighthouserc.prod.js; then
        log_success "Performance audit passed"
    else
        log_warning "Performance audit failed - check results for details"
    fi
    
    # Clean up temporary config
    rm -f lighthouserc.prod.js
}

send_deployment_notification() {
    log_info "Sending deployment notification..."
    
    local url="$1"
    local status="$2"
    
    # Send Slack notification if webhook URL is configured
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local color="good"
        local emoji="✅"
        
        if [ "$status" != "success" ]; then
            color="danger"
            emoji="❌"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"text\": \"$emoji HUNKCentral Production Deployment\",
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"fields\": [
                        {\"title\": \"Status\", \"value\": \"$status\", \"short\": true},
                        {\"title\": \"URL\", \"value\": \"$url\", \"short\": true},
                        {\"title\": \"Branch\", \"value\": \"main\", \"short\": true},
                        {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": true}
                    ]
                }]
            }" \
            "$SLACK_WEBHOOK_URL" || log_warning "Failed to send Slack notification"
    fi
    
    # Send email notification if configured
    if [ -n "$ALERT_EMAIL" ]; then
        log_info "Email notification would be sent to: $ALERT_EMAIL"
        # TODO: Implement email notification
    fi
}

rollback_deployment() {
    log_error "Deployment failed - initiating rollback..."
    
    # Get previous deployment
    PREVIOUS_DEPLOYMENT=$(vercel ls --token="$VERCEL_TOKEN" | grep "hunkcentral" | head -2 | tail -1 | awk '{print $2}')
    
    if [ -n "$PREVIOUS_DEPLOYMENT" ]; then
        log_info "Rolling back to previous deployment: $PREVIOUS_DEPLOYMENT"
        vercel promote "$PREVIOUS_DEPLOYMENT" --token="$VERCEL_TOKEN"
        log_success "Rollback completed"
    else
        log_error "No previous deployment found for rollback"
    fi
}

cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f lighthouserc.prod.js
    log_success "Cleanup completed"
}

# Main deployment process
main() {
    log_info "Starting HUNKCentral production deployment..."
    
    # Set up cleanup trap
    trap cleanup EXIT
    
    # Check prerequisites
    check_prerequisites
    
    # Run pre-deployment tests
    run_pre_deployment_tests
    
    # Deploy to Vercel
    deploy_to_vercel
    
    # Wait for deployment to be ready
    if ! wait_for_deployment "$DEPLOYMENT_URL"; then
        rollback_deployment
        send_deployment_notification "$DEPLOYMENT_URL" "failed"
        exit 1
    fi
    
    # Run post-deployment tests
    if ! run_post_deployment_tests "$DEPLOYMENT_URL"; then
        rollback_deployment
        send_deployment_notification "$DEPLOYMENT_URL" "failed"
        exit 1
    fi
    
    # Run performance audit
    run_performance_audit "$DEPLOYMENT_URL"
    
    # Send success notification
    send_deployment_notification "$DEPLOYMENT_URL" "success"
    
    log_success "Production deployment completed successfully!"
    log_info "Production URL: $DEPLOYMENT_URL"
    log_info "Health Check: $DEPLOYMENT_URL$HEALTH_CHECK_ENDPOINT"
}

# Run main function
main "$@"