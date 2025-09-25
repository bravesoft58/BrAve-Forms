#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating BrAve Forms Project Structure...\n');

const requiredFiles = [
  'package.json',
  'pnpm-workspace.yaml',
  'CLAUDE.md',
  'DEVELOPMENT_SETUP.md',
  'SPRINT_1_KICKOFF.md',
  '.env.example',
  'apps/backend/package.json',
  'apps/backend/src/main.ts',
  'apps/backend/src/app.module.ts',
  'apps/web/package.json',
  'apps/mobile/package.json',
  'packages/database/package.json',
  'packages/database/schema.prisma',
  'docs/design/TECH_STACK.md',
];

const requiredDirs = [
  'apps/backend/src/modules',
  'apps/backend/src/modules/auth',
  'apps/backend/src/modules/weather',
  'apps/backend/src/modules/database',
  'apps/backend/src/common',
  'apps/web/app',
  'apps/mobile/src',
  'infrastructure/terraform',
  'infrastructure/docker',
];

let allValid = true;

console.log('📁 Checking Required Files:');
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allValid = false;
  }
});

console.log('\n📂 Checking Required Directories:');
requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    console.log(`  ✅ ${dir}`);
  } else {
    console.log(`  ❌ ${dir} - MISSING`);
    allValid = false;
  }
});

// Check for EPA compliance code
console.log('\n⚡ Checking EPA Compliance Implementation:');
const weatherServicePath = path.join(__dirname, 'apps/backend/src/modules/weather/weather.service.ts');
if (fs.existsSync(weatherServicePath)) {
  const content = fs.readFileSync(weatherServicePath, 'utf8');
  if (content.includes('EPA_RAIN_THRESHOLD_INCHES = 0.25')) {
    console.log('  ✅ EPA 0.25" threshold correctly defined');
  } else {
    console.log('  ❌ EPA threshold not found or incorrect');
    allValid = false;
  }
}

// Check workspace configuration
console.log('\n🔧 Checking Workspace Configuration:');
const rootPackagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(rootPackagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
  const criticalScripts = ['dev', 'build', 'test', 'qa', 'test:compliance', 'test:offline'];
  
  criticalScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`  ✅ Script "${script}" defined`);
    } else {
      console.log(`  ❌ Script "${script}" missing`);
      allValid = false;
    }
  });
}

console.log('\n' + '='.repeat(50));
if (allValid) {
  console.log('✨ Project structure is ready for Sprint 1!');
  console.log('\nNext steps:');
  console.log('1. Install pnpm: npm install -g pnpm@8');
  console.log('2. Install dependencies: pnpm install');
  console.log('3. Set up PostgreSQL and Redis');
  console.log('4. Configure .env.local with Clerk keys');
  console.log('5. Run migrations: pnpm db:migrate');
  console.log('6. Start development: pnpm dev');
} else {
  console.log('⚠️  Some issues found. Please review and fix before starting development.');
}

process.exit(allValid ? 0 : 1);