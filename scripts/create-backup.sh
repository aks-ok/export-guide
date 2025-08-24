#!/bin/bash
# ExportRight Backup Script (Linux/Mac)
# Creates a complete backup of the project

timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
backup_name="ExportRight_Backup_$timestamp.zip"
backup_path="backups"

# Create backups directory if it doesn't exist
mkdir -p "$backup_path"

echo "🗜️ Creating backup: $backup_name"

# Files and folders to include in backup
include_items=(
    "src"
    "public" 
    "docs"
    "migrations"
    "scripts"
    ".github"
    ".kiro"
    "package.json"
    "package-lock.json"
    "tsconfig.json"
    "README.md"
    "LICENSE"
    ".env.example"
    "Dockerfile"
    "docker-compose.yml"
    "nginx.conf"
    "database-setup.sql"
    "jest.config.comprehensive.js"
)

echo "📦 Backing up project files..."

# Create temporary directory for backup
temp_dir="temp_backup_$timestamp"
mkdir -p "$temp_dir"

# Copy included items
for item in "${include_items[@]}"; do
    if [ -e "$item" ]; then
        cp -r "$item" "$temp_dir/"
        echo "✓ Copied: $item"
    else
        echo "⚠ Skipped (not found): $item"
    fi
done

# Remove excluded items from temp directory
find "$temp_dir" -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
find "$temp_dir" -name "build" -type d -exec rm -rf {} + 2>/dev/null || true
find "$temp_dir" -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
find "$temp_dir" -name ".env" -type f -delete 2>/dev/null || true
find "$temp_dir" -name ".env.local" -type f -delete 2>/dev/null || true
find "$temp_dir" -name "*.log" -type f -delete 2>/dev/null || true
find "$temp_dir" -name ".DS_Store" -type f -delete 2>/dev/null || true
find "$temp_dir" -name "Thumbs.db" -type f -delete 2>/dev/null || true

# Create zip file
if command -v zip &> /dev/null; then
    cd "$temp_dir"
    zip -r "../$backup_path/$backup_name" . -q
    cd ..
    echo "✅ Backup created successfully: $backup_path/$backup_name"
    
    # Get file size
    file_size=$(du -h "$backup_path/$backup_name" | cut -f1)
    echo "📦 Backup size: $file_size"
else
    echo "❌ Error: zip command not found. Please install zip utility."
fi

# Clean up temp directory
rm -rf "$temp_dir"

echo ""
echo "🎉 Backup process completed!"
echo "Backup location: $(pwd)/$backup_path/$backup_name"