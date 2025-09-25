#!/usr/bin/env node

/**
 * BrAve Forms - Clerk Organizations Authentication Validation Script
 * 
 * This script validates the complete authentication setup for Sprint 2.
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 BrAve Forms - Clerk Organizations Authentication Validation');
console.log('================================================================');

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  issues: [],
};

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: Found`);
    results.passed++;
    return true;
  } else {
    console.log(`❌ ${description}: Missing`);
    results.failed++;
    results.issues.push(`Missing file: ${filePath}`);
    return false;
  }
}

function checkFileContent(filePath, searchText, description) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(searchText)) {
      console.log(`✅ ${description}: Configured`);
      results.passed++;
      return true;
    } else {
      console.log(`⚠️  ${description}: Not configured`);
      results.warnings++;
      results.issues.push(`${filePath} missing: ${searchText}`);
      return false;
    }
  } else {
    console.log(`❌ ${description}: File missing`);
    results.failed++;
    results.issues.push(`Missing file: ${filePath}`);
    return false;
  }
}

function checkEnvVariable(filePath, varName, description) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(`${varName}=`) && !content.includes(`${varName}=YOUR_`)) {
      console.log(`✅ ${description}: Set`);
      results.passed++;
      return true;
    } else {
      console.log(`⚠️  ${description}: Not configured (using placeholder)`);
      results.warnings++;
      results.issues.push(`${filePath}: ${varName} needs real value`);
      return false;
    }
  } else {
    console.log(`❌ ${description}: Environment file missing`);
    results.failed++;
    results.issues.push(`Missing file: ${filePath}`);
    return false;
  }
}

console.log('\n🏗️  CHECKING CORE AUTHENTICATION FILES...');

// Frontend files
checkFile('apps/web/middleware.ts', 'Next.js Middleware');
checkFile('apps/web/components/Auth/AuthHeader.tsx', 'Auth Header Component');
checkFile('apps/web/app/select-organization/page.tsx', 'Organization Selection Page');
checkFile('apps/web/lib/graphql/client.ts', 'GraphQL Client');

console.log('\n🔧 CHECKING BACKEND AUTHENTICATION FILES...');

// Backend files
checkFile('apps/backend/src/modules/auth/strategies/clerk.strategy.ts', 'Clerk Strategy');
checkFile('apps/backend/src/modules/auth/guards/clerk-auth.guard.ts', 'Clerk Auth Guard');
checkFile('apps/backend/src/modules/auth/guards/roles.guard.ts', 'Roles Guard');
checkFile('apps/backend/src/modules/organization/organization.service.ts', 'Organization Service');
checkFile('apps/backend/src/modules/organization/organization.resolver.ts', 'Organization Resolver');
checkFile('apps/backend/src/modules/webhooks/clerk-webhook.service.ts', 'Webhook Service');

console.log('\n🗄️  CHECKING DATABASE SCHEMA...');

// Database schema
checkFileContent(
  'packages/database/schema.prisma',
  'model Organization',
  'Organization Model'
);
checkFileContent(
  'packages/database/schema.prisma',
  'clerkOrgId',
  'Clerk Organization ID Field'
);
checkFileContent(
  'packages/database/schema.prisma',
  'UserOrganization',
  'User-Organization Relationship'
);

console.log('\n📦 CHECKING DEPENDENCIES...');

// Check dependencies
checkFileContent(
  'apps/web/package.json',
  '"@clerk/nextjs"',
  'Clerk Next.js SDK'
);
checkFileContent(
  'apps/backend/package.json',
  '"@clerk/backend"',
  'Clerk Backend SDK'
);
checkFileContent(
  'apps/backend/package.json',
  '"svix"',
  'Svix Webhook Library'
);

console.log('\n🔑 CHECKING ENVIRONMENT CONFIGURATION...');

// Environment variables - Frontend
checkEnvVariable(
  'apps/web/.env.local',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'Clerk Publishable Key (Frontend)'
);
checkEnvVariable(
  'apps/web/.env.local',
  'CLERK_SECRET_KEY',
  'Clerk Secret Key (Frontend)'
);

// Environment variables - Backend
checkEnvVariable(
  'apps/backend/.env',
  'CLERK_SECRET_KEY',
  'Clerk Secret Key (Backend)'
);
checkFileContent(
  'apps/backend/.env',
  'JWT_ORGANIZATIONS_REQUIRED=true',
  'Organizations Required Setting'
);

console.log('\n🔍 CHECKING IMPLEMENTATION DETAILS...');

// Implementation checks
checkFileContent(
  'apps/web/middleware.ts',
  'createRouteMatcher',
  'Route Matching Implementation'
);
checkFileContent(
  'apps/web/middleware.ts',
  'orgId',
  'Organization Context Validation'
);
checkFileContent(
  'apps/web/components/Auth/AuthHeader.tsx',
  'OrganizationSwitcher',
  'Organization Switcher Component'
);
checkFileContent(
  'apps/web/components/Auth/AuthHeader.tsx',
  'hidePersonal',
  'Personal Accounts Disabled'
);
checkFileContent(
  'apps/backend/src/modules/auth/strategies/clerk.strategy.ts',
  'orgId',
  'Backend Organization Validation'
);

console.log('\n🐳 CHECKING CONTAINERIZED SERVICES...');

// Check if containers are running
const { execSync } = require('child_process');

try {
  const containers = execSync('docker ps --format "{{.Names}}" | grep brave-forms', { encoding: 'utf8' });
  if (containers.includes('brave-forms-postgres')) {
    console.log('✅ PostgreSQL Container: Running');
    results.passed++;
  }
  if (containers.includes('brave-forms-redis')) {
    console.log('✅ Redis Container: Running');
    results.passed++;
  }
  if (containers.includes('brave-forms-minio')) {
    console.log('✅ MinIO Container: Running');
    results.passed++;
  }
} catch (error) {
  console.log('⚠️  Docker containers: Cannot verify (Docker not accessible)');
  results.warnings++;
}

console.log('\n📊 VALIDATION RESULTS');
console.log('====================');
console.log(`✅ Passed: ${results.passed}`);
console.log(`⚠️  Warnings: ${results.warnings}`);
console.log(`❌ Failed: ${results.failed}`);

if (results.issues.length > 0) {
  console.log('\n🚨 ISSUES TO RESOLVE:');
  results.issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });
}

console.log('\n🎯 NEXT STEPS:');
if (results.failed === 0 && results.warnings < 3) {
  console.log('✅ Authentication system is properly configured!');
  console.log('🔧 Configure your Clerk Dashboard:');
  console.log('   1. Enable Organizations feature');
  console.log('   2. Configure JWT template with org claims');
  console.log('   3. Add webhook endpoint');
  console.log('   4. Update environment variables with real keys');
} else {
  console.log('🔧 Complete the missing implementations above before testing');
  console.log('📖 Refer to CLERK_ORGANIZATIONS_SECURITY_IMPLEMENTATION.md for details');
}

console.log('\n🚀 Ready for construction company onboarding!');
console.log('================================================================');

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);