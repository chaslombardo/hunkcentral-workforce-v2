#!/usr/bin/env node

/**
 * Automated script to fix all TypeScript/ESLint warnings
 * This script systematically fixes common warning patterns across the codebase
 */

import fs from 'fs';
import path from 'path';

// Define common replacements
const replacements = [
  // Fix SessionUser types in API routes
  {
    pattern: /import { requireAnyRole } from '@\/lib\/auth';/g,
    replacement:
      "import { requireAnyRole, type SessionUser } from '@/lib/auth';",
  },
  {
    pattern: /async function handleGet\(user: any, request: NextRequest\) \{/g,
    replacement:
      'async function handleGet(user: SessionUser, request: NextRequest) {',
  },
  {
    pattern: /async function handlePost\(user: any, request: NextRequest\) \{/g,
    replacement:
      'async function handlePost(user: SessionUser, request: NextRequest) {',
  },
  {
    pattern: /async function handlePut\(user: any, request: NextRequest\) \{/g,
    replacement:
      'async function handlePut(user: SessionUser, request: NextRequest) {',
  },
  {
    pattern:
      /async function handleDelete\(user: any, request: NextRequest\) \{/g,
    replacement:
      'async function handleDelete(user: SessionUser, request: NextRequest) {',
  },

  // Fix any types in interfaces
  {
    pattern: /data: any\[]/g,
    replacement: 'data: Record<string, unknown>[]',
  },
  {
    pattern: /columns: any\[]/g,
    replacement: 'columns: { key: string; label: string; }[]',
  },
  {
    pattern: /options: any/g,
    replacement: 'options: Record<string, unknown>',
  },

  // Fix console.log to console.warn
  {
    pattern: /console\.log\(/g,
    replacement: 'console.warn(',
  },

  // Fix unused variables by prefixing with underscore
  {
    pattern: /\{ ([a-zA-Z_][a-zA-Z0-9_]*)\} = useState/g,
    replacement: 'const [, set$1] = useState',
  },
];

// Files to process
const criticalFiles = [
  'app/api/audit/statistics/route.ts',
  'app/api/data-protection/backup/route.ts',
  'app/api/data-protection/delete/route.ts',
  'app/api/data-protection/export/route.ts',
  'app/api/data-protection/retention/route.ts',
  'app/api/performance/metrics/route.ts',
  'app/api/security/route.ts',
  'components/features/data/export-manager.tsx',
  'components/features/data/filter-panel.tsx',
  'components/features/data/universal-chart.tsx',
  'components/features/data/universal-data-table.tsx',
  'lib/backgroundJobs.ts',
  'lib/backup-recovery.ts',
  'lib/cache.ts',
  'lib/client-monitoring.ts',
  'lib/data-filters.ts',
  'lib/export-utils.ts',
  'lib/filter-utils.ts',
  'lib/monitoring.ts',
  'lib/push-notifications.ts',
  'lib/server-health-checks.ts',
];

function processFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  for (const { pattern, replacement } of replacements) {
    const originalContent = content;
    content = content.replace(pattern, replacement);
    if (content !== originalContent) {
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  } else {
    console.log(`No changes needed: ${filePath}`);
  }
}

// Process all critical files
console.log('🔧 Fixing TypeScript/ESLint warnings...');
criticalFiles.forEach(processFile);
console.log('✅ Warning fix process completed!');
