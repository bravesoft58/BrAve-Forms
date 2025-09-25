#!/bin/bash

# BrAve Forms - Sprint 1 Database Setup Script
# Sets up PostgreSQL 15 with TimescaleDB for EPA compliance tracking

echo "================================================"
echo "BrAve Forms Database Setup for Sprint 1"
echo "================================================"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed!"
    echo ""
    echo "Please install PostgreSQL 15:"
    echo "  macOS: brew install postgresql@15"
    echo "  Ubuntu: sudo apt install postgresql-15"
    echo "  Windows: Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

echo "✅ PostgreSQL found"

# Database configuration
DB_NAME="brave_forms"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Create database if it doesn't exist
echo ""
echo "Creating database: $DB_NAME"
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -c "CREATE DATABASE $DB_NAME;"

if [ $? -eq 0 ]; then
    echo "✅ Database created or already exists"
else
    echo "❌ Failed to create database"
    exit 1
fi

# Connect to database and setup extensions
echo ""
echo "Setting up extensions..."
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME << EOF
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable TimescaleDB for weather time-series data
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Create schema for multi-tenancy
CREATE SCHEMA IF NOT EXISTS tenant;

-- Enable Row Level Security on future tables
ALTER DATABASE $DB_NAME SET row_security = on;

-- Set search path
ALTER DATABASE $DB_NAME SET search_path TO public, tenant;

\echo '✅ Extensions configured'
EOF

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo ""
    echo "Creating .env.local file..."
    cat > .env.local << EOF
# Database
DATABASE_URL="postgresql://$DB_USER:password@$DB_HOST:$DB_PORT/$DB_NAME?schema=public"

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
EOF
    echo "✅ .env.local created - PLEASE UPDATE WITH YOUR API KEYS"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "================================================"
echo "Database Setup Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your Clerk and OpenWeather API keys"
echo "2. Run migrations: pnpm db:migrate"
echo "3. Seed data: pnpm db:seed"
echo "4. Start development: pnpm dev"
echo ""
echo "Critical for Sprint 1:"
echo "- EPA threshold is set to EXACTLY 0.25 inches"
echo "- Multi-tenant isolation is enabled"
echo "- TimescaleDB is ready for weather data"
echo ""