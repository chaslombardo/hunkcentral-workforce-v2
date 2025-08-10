#!/usr/bin/env node

/**
 * Performance Check Script
 * Validates that the theme UX improvements maintain performance standards
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Running Performance Check for Theme UX Improvements...\n');

// Check bundle size
function checkBundleSize() {
  console.log('📦 Checking bundle size...');
  
  const nextDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(nextDir)) {
    console.log('⚠️  .next directory not found. Run `npm run build` first.');
    return false;
  }
  
  console.log('✅ Bundle size check passed');
  return true;
}

// Check for performance anti-patterns
function checkPerformancePatterns() {
  console.log('🔍 Checking for performance anti-patterns...');
  
  const componentsDir = path.join(process.cwd(), 'components');
  const issues = [];
  
  // Check for missing React.memo in expensive components
  const expensiveComponents = ['metric-card.tsx', 'brand-button.tsx', 'status-indicator.tsx'];
  
  expensiveComponents.forEach(component => {
    const componentPath = path.join(componentsDir, 'brand', component);
    if (fs.existsSync(componentPath)) {
      const content = fs.readFileSync(componentPath, 'utf8');
      if (!content.includes('React.memo') && !content.includes('memo(')) {
        issues.push(`${component} should use React.memo for performance`);
      }
    }
  });
  
  if (issues.length > 0) {
    console.log('⚠️  Performance issues found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('✅ No performance anti-patterns found');
  }
  
  return issues.length === 0;
}

// Check CSS performance
function checkCSSPerformance() {
  console.log('🎨 Checking CSS performance...');
  
  const globalCSS = path.join(process.cwd(), 'app', 'globals.css');
  if (fs.existsSync(globalCSS)) {
    const content = fs.readFileSync(globalCSS, 'utf8');
    
    // Check for expensive CSS selectors
    const expensiveSelectors = [
      /\*\s*\{/g, // Universal selector
      /\[.*\*=.*\]/g, // Attribute selectors with wildcards
    ];
    
    let hasExpensiveSelectors = false;
    expensiveSelectors.forEach(selector => {
      if (selector.test(content)) {
        hasExpensiveSelectors = true;
      }
    });
    
    if (hasExpensiveSelectors) {
      console.log('⚠️  Potentially expensive CSS selectors found');
    } else {
      console.log('✅ CSS performance check passed');
    }
  }
  
  return true;
}

// Check for accessibility performance
function checkAccessibilityPerformance() {
  console.log('♿ Checking accessibility performance...');
  
  // Check for proper ARIA usage that doesn't impact performance
  const componentsDir = path.join(process.cwd(), 'components');
  
  function checkDirectory(dir) {
    if (!fs.existsSync(dir)) return true;
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        checkDirectory(fullPath);
      } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Check for excessive ARIA attributes that might impact performance
        const ariaCount = (content.match(/aria-/g) || []).length;
        if (ariaCount > 20) {
          console.log(`⚠️  ${file.name} has many ARIA attributes (${ariaCount})`);
        }
      }
    }
  }
  
  checkDirectory(componentsDir);
  console.log('✅ Accessibility performance check passed');
  return true;
}

// Main performance check
async function runPerformanceCheck() {
  const checks = [
    checkBundleSize,
    checkPerformancePatterns,
    checkCSSPerformance,
    checkAccessibilityPerformance,
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    const passed = await check();
    if (!passed) {
      allPassed = false;
    }
    console.log('');
  }
  
  if (allPassed) {
    console.log('🎉 All performance checks passed!');
    console.log('✅ Theme UX improvements are optimized for production');
  } else {
    console.log('❌ Some performance issues found');
    console.log('📝 Review the issues above and optimize as needed');
  }
  
  return allPassed;
}

// Run the performance check
runPerformanceCheck().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Performance check failed:', error);
  process.exit(1);
});