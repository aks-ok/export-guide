# ExportRight Backup Script
# Creates a complete backup of the project

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupName = "ExportRight_Backup_$timestamp.zip"
$backupPath = "backups"

# Create backups directory if it doesn't exist
if (!(Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath
}

Write-Host "Creating backup: $backupName" -ForegroundColor Green

# Files and folders to include in backup
$includeItems = @(
    "src",
    "public", 
    "docs",
    "migrations",
    "scripts",
    ".github",
    ".kiro",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "README.md",
    "LICENSE",
    ".env.example",
    "Dockerfile",
    "docker-compose.yml",
    "nginx.conf",
    "database-setup.sql",
    "jest.config.comprehensive.js"
)

Write-Host "Backing up project files..." -ForegroundColor Yellow

# Create temporary directory for backup
$tempDir = "temp_backup_$timestamp"
New-Item -ItemType Directory -Path $tempDir

# Copy included items
foreach ($item in $includeItems) {
    if (Test-Path $item) {
        if (Test-Path $item -PathType Container) {
            Copy-Item -Path $item -Destination $tempDir -Recurse -Force
            Write-Host "✓ Copied folder: $item" -ForegroundColor Cyan
        } else {
            Copy-Item -Path $item -Destination $tempDir -Force
            Write-Host "✓ Copied file: $item" -ForegroundColor Cyan
        }
    } else {
        Write-Host "⚠ Skipped (not found): $item" -ForegroundColor Yellow
    }
}

# Create zip file
try {
    Compress-Archive -Path "$tempDir\*" -DestinationPath "$backupPath\$backupName" -Force
    Write-Host "✅ Backup created successfully: $backupPath\$backupName" -ForegroundColor Green
    
    # Get file size
    $fileSize = (Get-Item "$backupPath\$backupName").Length / 1MB
    Write-Host "📦 Backup size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Error creating backup: $($_.Exception.Message)" -ForegroundColor Red
}

# Clean up temp directory
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "`n🎉 Backup process completed!" -ForegroundColor Green
Write-Host "Backup location: $(Resolve-Path "$backupPath\$backupName")" -ForegroundColor White