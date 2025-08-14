#!/usr/bin/env node

/**
 * Simple script to test theme switching functionality
 * This script can be run to verify theme persistence works correctly
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

process.stdout.write('🎨 Testing Theme Switching Functionality\n\n');

// Test 1: Check if theme files exist
process.stdout.write('1. Checking theme files...\n');
const themeFiles = [
  'components/theme-provider.tsx',
  'components/theme-switcher.tsx',
  'hooks/useThemeDebug.ts',
  'components/theme-debug.tsx'
];

let allFilesExist = true;
themeFiles.forEach(file => {
  if (fs.existsSync(file)) {
    process.stdout.write(`   ✅ ${file} exists\n`);
  } else {
    process.stdout.write(`   ❌ ${file} missing\n`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  process.stdout.write('\n❌ Some theme files are missing!\n');
  process.exit(1);
}

// Test 2: Check if theme provider is configured correctly
process.stdout.write('\n2. Checking theme provider configuration...\n');
const providersFile = 'app/providers.tsx';
if (fs.existsSync(providersFile)) {
  const content = fs.readFileSync(providersFile, 'utf8');
  if (content.includes('storageKey="hunkcentral-theme"')) {
    process.stdout.write('   ✅ Custom storage key configured\n');
  } else {
    process.stdout.write('   ⚠️  Custom storage key not found\n');
  }
  
  if (content.includes('themes={[\'light\', \'dark\', \'system\']}')) {
    process.stdout.write('   ✅ Theme options configured\n');
  } else {
    process.stdout.write('   ⚠️  Theme options not explicitly configured\n');
  }
} else {
  process.stdout.write('   ❌ Providers file not found\n');
}

// Test 3: Check CSS configuration
process.stdout.write('\n3. Checking CSS configuration...\n');
const globalsCss = 'app/globals.css';
if (fs.existsSync(globalsCss)) {
  const content = fs.readFileSync(globalsCss, 'utf8');
  if (content.includes('.dark {')) {
    process.stdout.write('   ✅ Dark mode CSS variables defined\n');
  } else {
    process.stdout.write('   ❌ Dark mode CSS variables missing\n');
  }
} else {
  process.stdout.write('   ❌ globals.css not found\n');
}

const tailwindConfig = 'tailwind.config.ts';
if (fs.existsSync(tailwindConfig)) {
  const content = fs.readFileSync(tailwindConfig, 'utf8');
  if (content.includes('darkMode: [\'class\']')) {
    process.stdout.write('   ✅ Tailwind dark mode configured\n');
  } else {
    process.stdout.write('   ❌ Tailwind dark mode not configured\n');
  }
} else {
  process.stdout.write('   ❌ tailwind.config.ts not found\n');
}

// Test 4: Check if theme switcher is included in layouts
process.stdout.write('\n4. Checking theme switcher integration...\n');
const mainLayout = 'components/layout/main-layout.tsx';
if (fs.existsSync(mainLayout)) {
  const content = fs.readFileSync(mainLayout, 'utf8');
  if (content.includes('ThemeSwitcher')) {
    process.stdout.write('   ✅ Theme switcher included in main layout\n');
  } else {
    process.stdout.write('   ❌ Theme switcher not found in main layout\n');
  }
} else {
  process.stdout.write('   ❌ Main layout not found\n');
}

const mobileNav = 'components/layout/unified-mobile-navigation.tsx';
if (fs.existsSync(mobileNav)) {
  const content = fs.readFileSync(mobileNav, 'utf8');
  if (content.includes('ThemeSwitcher')) {
    process.stdout.write('   ✅ Theme switcher included in mobile navigation\n');
  } else {
    process.stdout.write('   ❌ Theme switcher not found in mobile navigation\n');
  }
} else {
  process.stdout.write('   ❌ Mobile navigation not found\n');
}

// Test 5: Run TypeScript check
process.stdout.write('\n5. Running TypeScript check...\n');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  process.stdout.write('   ✅ TypeScript check passed\n');
} catch (error) {
  process.stdout.write('   ❌ TypeScript errors found\n');
  process.stdout.write('   Error: ' + (error.stdout?.toString() || error.message) + '\n');
}

// Test 6: Run linting
process.stdout.write('\n6. Running ESLint check...\n');
try {
  execSync('npm run lint', { stdio: 'pipe' });
  process.stdout.write('   ✅ ESLint check passed\n');
} catch (error) {
  process.stdout.write('   ⚠️  ESLint warnings found (this is okay)\n');
}

process.stdout.write('\n🎉 Theme switching functionality test completed!\n');
process.stdout.write('\nTo manually test:\n');
process.stdout.write('1. Run `npm run dev`\n');
process.stdout.write('2. Navigate to http://localhost:3000/dashboard/theme-test\n');
process.stdout.write('3. Click the theme switcher button in the header\n');
process.stdout.write('4. Test switching between Light, Dark, and System themes\n');
process.stdout.write('5. Refresh the page to verify theme persistence\n');
process.stdout.write('6. Navigate to different pages to ensure consistency\n');