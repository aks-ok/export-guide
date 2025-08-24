# Simple ExportRight Backup Script
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupName = "ExportRight_Backup_$timestamp.zip"

# Create backups directory
if (!(Test-Path "backups")) {
    New-Item -ItemType Directory -Path "backups"
}

Write-Host "Creating backup..." -ForegroundColor Green

# Create zip of important files
$filesToBackup = @(
    "src\*",
    "public\*", 
    "docs\*",
    "migrations\*",
    "scripts\*",
    ".github\*",
    ".kiro\*",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "README.md",
    "LICENSE",
    ".env.example",
    "Dockerfile",
    "docker-compose.yml"
)

Compress-Archive -Path $filesToBackup -DestinationPath "backups\$backupName" -Force

$fileSize = (Get-Item "backups\$backupName").Length / 1MB
Write-Host "Backup created: backups\$backupName" -ForegroundColor Green
Write-Host "Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan