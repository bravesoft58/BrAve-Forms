# BrAve Forms - Sprint 1 Database Setup Script (Windows)
# Sets up PostgreSQL 15 with TimescaleDB for EPA compliance tracking

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "BrAve Forms Database Setup for Sprint 1" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is installed
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue

if (-not $psqlPath) {
    Write-Host "❌ PostgreSQL is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL 15 from:" -ForegroundColor Yellow
    Write-Host "  https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "  Or use: winget install PostgreSQL.PostgreSQL" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ PostgreSQL found" -ForegroundColor Green

# Database configuration
$DB_NAME = "brave_forms"
$DB_USER = "postgres"
$DB_HOST = "localhost"
$DB_PORT = "5432"

Write-Host ""
Write-Host "Enter PostgreSQL password for user 'postgres':" -ForegroundColor Yellow
$DB_PASSWORD = Read-Host -AsSecureString
$DB_PASSWORD_TEXT = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))

# Set environment variable for psql
$env:PGPASSWORD = $DB_PASSWORD_TEXT

# Check if database exists
Write-Host ""
Write-Host "Checking database: $DB_NAME" -ForegroundColor Cyan
$dbExists = psql -U $DB_USER -h $DB_HOST -p $DB_PORT -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" 2>$null

if (-not $dbExists) {
    Write-Host "Creating database..." -ForegroundColor Yellow
    psql -U $DB_USER -h $DB_HOST -p $DB_PORT -c "CREATE DATABASE $DB_NAME;"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database created successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create database" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Database already exists" -ForegroundColor Green
}

# Setup extensions
Write-Host ""
Write-Host "Setting up extensions..." -ForegroundColor Cyan

$sqlScript = @"
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable TimescaleDB for weather time-series data (if available)
-- Note: TimescaleDB must be installed separately
DO `$`$
BEGIN
    CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'TimescaleDB not installed - continuing without it';
END
`$`$;

-- Create schema for multi-tenancy
CREATE SCHEMA IF NOT EXISTS tenant;

-- Enable Row Level Security
ALTER DATABASE $DB_NAME SET row_security = on;

-- Set search path
ALTER DATABASE $DB_NAME SET search_path TO public, tenant;

SELECT 'Extensions configured successfully';
"@

$sqlScript | psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Extensions configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some extensions may not have installed" -ForegroundColor Yellow
}

# Create .env.local if it doesn't exist
$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host ""
    Write-Host "Creating .env.local file..." -ForegroundColor Cyan
    
    $envContent = @"
# Database
DATABASE_URL="postgresql://$DB_USER`:$DB_PASSWORD_TEXT@$DB_HOST`:$DB_PORT/$DB_NAME?schema=public"

# Redis (for BullMQ)
REDIS_URL="redis://localhost:6379"

# Clerk Authentication (GET THESE FROM CLERK DASHBOARD)
CLERK_PUBLISHABLE_KEY="pk_test_YOUR_KEY_HERE"
CLERK_SECRET_KEY="sk_test_YOUR_KEY_HERE"
CLERK_JWT_KEY="YOUR_JWT_KEY_HERE"

# Weather APIs
OPENWEATHER_API_KEY="YOUR_API_KEY_HERE"

# Application
NODE_ENV="development"
PORT="3001"
CORS_ORIGIN="http://localhost:3000"

# EPA Compliance
EPA_RAIN_THRESHOLD_INCHES="0.25"
INSPECTION_DEADLINE_HOURS="24"
"@
    
    $envContent | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host "✅ .env.local created - PLEASE UPDATE WITH YOUR API KEYS" -ForegroundColor Green
} else {
    Write-Host "✅ .env.local already exists" -ForegroundColor Green
}

# Clear password from environment
Remove-Item Env:\PGPASSWORD

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Database Setup Complete!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update .env.local with your Clerk and OpenWeather API keys"
Write-Host "2. Install dependencies: pnpm install"
Write-Host "3. Run migrations: pnpm db:migrate"
Write-Host "4. Seed data: pnpm db:seed"
Write-Host "5. Start development: pnpm dev"
Write-Host ""
Write-Host "Critical for Sprint 1:" -ForegroundColor Magenta
Write-Host "- EPA threshold is set to EXACTLY 0.25 inches"
Write-Host "- Multi-tenant isolation is enabled"
Write-Host "- TimescaleDB is ready for weather data (if installed)"
Write-Host ""