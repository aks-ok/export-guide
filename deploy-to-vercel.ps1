# ExportGuide Platform - Vercel Deployment Script
# Run this script to deploy your application to Vercel

Write-Host "🚀 ExportGuide Platform - Vercel Deployment" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check if Vercel CLI is installed
Write-Host "📋 Checking Vercel CLI installation..." -ForegroundColor Yellow
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
    Write-Host "✅ Vercel CLI installed successfully" -ForegroundColor Green
}

# Check if user is logged in to Vercel
Write-Host "🔐 Checking Vercel authentication..." -ForegroundColor Yellow
try {
    $whoami = vercel whoami 2>$null
    if ($whoami) {
        Write-Host "✅ Logged in as: $whoami" -ForegroundColor Green
    } else {
        Write-Host "🔑 Please log in to Vercel..." -ForegroundColor Yellow
        vercel login
    }
} catch {
    Write-Host "🔑 Please log in to Vercel..." -ForegroundColor Yellow
    vercel login
}

# Test build locally first
Write-Host "🔨 Testing local build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Local build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Local build failed. Please fix errors before deploying." -ForegroundColor Red
    exit 1
}

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 Deployment successful!" -ForegroundColor Green
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Configure environment variables in Vercel dashboard" -ForegroundColor White
    Write-Host "   2. Set up custom domain (optional)" -ForegroundColor White
    Write-Host "   3. Configure Supabase URL whitelist" -ForegroundColor White
    Write-Host "   4. Run database migrations" -ForegroundColor White
    Write-Host "   5. Test your deployed application" -ForegroundColor White
} else {
    Write-Host "❌ Deployment failed. Check the error messages above." -ForegroundColor Red
    exit 1
}

Write-Host "📚 For detailed instructions, see VERCEL_DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan