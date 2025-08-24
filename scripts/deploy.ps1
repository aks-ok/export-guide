# ExportRight Deployment Script for Windows PowerShell
# Usage: .\scripts\deploy.ps1 [environment]
# Environments: development, staging, production

param(
    [Parameter(Position=0)]
    [ValidateSet("development", "staging", "production")]
    [string]$Environment = "development",
    
    [switch]$Rollback,
    [switch]$Cleanup,
    [switch]$Help
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Colors for output (Windows PowerShell compatible)
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

# Show help
if ($Help) {
    Write-Host "ExportRight Deployment Script for Windows"
    Write-Host ""
    Write-Host "Usage: .\scripts\deploy.ps1 [environment] [options]"
    Write-Host ""
    Write-Host "Environments:"
    Write-Host "  development  - Start development server"
    Write-Host "  staging      - Deploy to staging environment"
    Write-Host "  production   - Deploy to production environment"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Rollback    - Rollback to previous version"
    Write-Host "  -Cleanup     - Clean up temporary files"
    Write-Host "  -Help        - Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\scripts\deploy.ps1 development"
    Write-Host "  .\scripts\deploy.ps1 staging"
    Write-Host "  .\scripts\deploy.ps1 production"
    Write-Host "  .\scripts\deploy.ps1 -Rollback"
    exit 0
}

# Cleanup function
function Invoke-Cleanup {
    Write-Info "Cleaning up..."
    
    # Remove temporary files
    if (Test-Path "$ProjectRoot\build") {
        Remove-Item "$ProjectRoot\build" -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    Write-Success "Cleanup completed"
}

# Rollback function
function Invoke-Rollback {
    Write-Warning "Rolling back deployment..."
    
    switch ($Environment) {
        { $_ -in @("staging", "production") } {
            # Stop current containers
            docker-compose down
            
            # Start previous version (if available)
            $previousImage = docker images --format "table {{.Repository}}:{{.Tag}}" | Select-String "exportright:previous"
            if ($previousImage) {
                docker tag exportright:previous "exportright:$Environment"
                docker-compose up -d
                Write-Success "Rollback completed"
            } else {
                Write-Error "No previous version available for rollback"
            }
        }
        default {
            Write-Info "Rollback not applicable for $Environment"
        }
    }
}

# Handle special operations
if ($Cleanup) {
    Invoke-Cleanup
    exit 0
}

if ($Rollback) {
    Invoke-Rollback
    exit 0
}

# Check prerequisites
function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Info "Node.js version: $nodeVersion"
    } catch {
        Write-Error "Node.js is not installed"
        exit 1
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-Info "npm version: $npmVersion"
    } catch {
        Write-Error "npm is not installed"
        exit 1
    }
    
    # Check environment file
    $envFile = "$ProjectRoot\.env.$Environment"
    if (-not (Test-Path $envFile)) {
        Write-Warning "Environment file not found: $envFile"
        Write-Info "Using .env.example as template"
        Copy-Item "$ProjectRoot\.env.example" $envFile
    }
    
    Write-Success "Prerequisites check completed"
}

# Install dependencies
function Install-Dependencies {
    Write-Info "Installing dependencies..."
    Set-Location $ProjectRoot
    npm ci
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install dependencies"
        exit 1
    }
    Write-Success "Dependencies installed"
}

# Run tests
function Invoke-Tests {
    Write-Info "Running tests..."
    Set-Location $ProjectRoot
    
    # Run linting
    Write-Info "Running linting..."
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Linting failed"
        exit 1
    }
    
    # Run type checking
    Write-Info "Running type checking..."
    npm run type-check
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Type checking failed"
        exit 1
    }
    
    # Run unit tests
    Write-Info "Running unit tests..."
    npm test -- --coverage --watchAll=false
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Unit tests failed"
        exit 1
    }
    
    # Run integration tests
    Write-Info "Running integration tests..."
    npm run test:integration
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Integration tests failed"
        exit 1
    }
    
    Write-Success "All tests passed"
}

# Build application
function Build-Application {
    Write-Info "Building application for $Environment..."
    Set-Location $ProjectRoot
    
    # Set environment variables
    $env:NODE_ENV = $Environment
    
    # Load environment file if it exists
    $envFile = "$ProjectRoot\.env.$Environment"
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^([^#][^=]+)=(.*)$') {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            }
        }
    }
    
    # Build
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed"
        exit 1
    }
    
    Write-Success "Application built successfully"
}

# Deploy to development
function Deploy-Development {
    Write-Info "Starting development server..."
    Set-Location $ProjectRoot
    npm start
}

# Deploy to staging
function Deploy-Staging {
    Write-Info "Deploying to staging..."
    
    # Build Docker image
    Write-Info "Building Docker image..."
    Set-Location $ProjectRoot
    docker build -t exportright:staging .
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker build failed"
        exit 1
    }
    
    # Deploy with Docker Compose
    Write-Info "Deploying with Docker Compose..."
    docker-compose -f docker-compose.yml up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker Compose deployment failed"
        exit 1
    }
    
    Write-Success "Deployed to staging"
}

# Deploy to production
function Deploy-Production {
    Write-Info "Deploying to production..."
    
    # Confirm production deployment
    $confirm = Read-Host "Are you sure you want to deploy to PRODUCTION? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Info "Production deployment cancelled"
        exit 0
    }
    
    # Deploy based on configuration
    if ($env:VERCEL_TOKEN) {
        Deploy-Vercel
    } elseif ($env:AWS_ACCESS_KEY_ID) {
        Deploy-AWS
    } else {
        Deploy-DockerProduction
    }
}

# Deploy to Vercel
function Deploy-Vercel {
    Write-Info "Deploying to Vercel..."
    
    # Check if Vercel CLI is installed
    try {
        vercel --version | Out-Null
    } catch {
        Write-Info "Installing Vercel CLI..."
        npm install -g vercel
    }
    
    vercel --prod
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Vercel deployment failed"
        exit 1
    }
    
    Write-Success "Deployed to Vercel"
}

# Deploy to AWS
function Deploy-AWS {
    Write-Info "Deploying to AWS..."
    
    # Check if AWS CLI is installed
    try {
        aws --version | Out-Null
    } catch {
        Write-Error "AWS CLI is not installed"
        exit 1
    }
    
    # Upload to S3
    Write-Info "Uploading to S3..."
    aws s3 sync build/ "s3://$env:S3_BUCKET" --delete
    if ($LASTEXITCODE -ne 0) {
        Write-Error "S3 upload failed"
        exit 1
    }
    
    # Invalidate CloudFront
    if ($env:CLOUDFRONT_DISTRIBUTION_ID) {
        Write-Info "Invalidating CloudFront cache..."
        aws cloudfront create-invalidation --distribution-id $env:CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
    }
    
    Write-Success "Deployed to AWS"
}

# Deploy with Docker to production
function Deploy-DockerProduction {
    Write-Info "Deploying with Docker to production..."
    
    # Build production image
    Write-Info "Building production Docker image..."
    Set-Location $ProjectRoot
    docker build -t exportright:production .
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker build failed"
        exit 1
    }
    
    # Deploy with Docker Compose
    Write-Info "Deploying with Docker Compose..."
    docker-compose -f docker-compose.yml up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker Compose deployment failed"
        exit 1
    }
    
    Write-Success "Deployed to production with Docker"
}

# Health check
function Test-Health {
    Write-Info "Performing health check..."
    
    switch ($Environment) {
        "development" { $url = "http://localhost:3000" }
        "staging" { $url = "http://localhost:80" }
        "production" { $url = if ($env:PRODUCTION_URL) { $env:PRODUCTION_URL } else { "http://localhost:80" } }
    }
    
    # Wait for application to start
    Start-Sleep -Seconds 10
    
    # Check if application is responding
    try {
        $response = Invoke-WebRequest -Uri "$url/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Success "Health check passed - Application is running"
        } else {
            Write-Warning "Health check failed - Unexpected status code: $($response.StatusCode)"
        }
    } catch {
        Write-Warning "Health check failed - Application may not be fully ready"
    }
}

# Main deployment function
function Start-Deployment {
    Write-Info "Starting ExportRight deployment..."
    Write-Info "Environment: $Environment"
    Write-Info "Timestamp: $(Get-Date)"
    
    try {
        Test-Prerequisites
        Install-Dependencies
        
        # Skip tests in development mode for faster iteration
        if ($Environment -ne "development") {
            Invoke-Tests
        }
        
        Build-Application
        
        # Deploy based on environment
        switch ($Environment) {
            "development" {
                Deploy-Development
            }
            "staging" {
                Deploy-Staging
                Test-Health
            }
            "production" {
                Deploy-Production
                Test-Health
            }
        }
        
        Write-Success "Deployment completed successfully!"
        Write-Info "Environment: $Environment"
        Write-Info "Timestamp: $(Get-Date)"
        
    } catch {
        Write-Error "Deployment failed: $($_.Exception.Message)"
        Invoke-Cleanup
        exit 1
    }
}

# Run main function
Start-Deployment