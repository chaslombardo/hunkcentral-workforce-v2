#!/usr/bin/env node

/**
 * CI/CD Setup Verification Script
 *
 * This script checks if all necessary components for the CI/CD pipeline are properly configured.
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(message, color = colors.reset) {
  // eslint-disable-next-line no-console
  console.log(`${color}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const exists = existsSync(filePath);
  log(
    `${exists ? '✅' : '❌'} ${description}: ${filePath}`,
    exists ? colors.green : colors.red
  );
  return exists;
}

function checkPackageScript(scriptName, description) {
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const hasScript = packageJson.scripts && packageJson.scripts[scriptName];
    log(
      `${hasScript ? '✅' : '❌'} ${description}: npm run ${scriptName}`,
      hasScript ? colors.green : colors.red
    );
    return hasScript;
  } catch (error) {
    log(`❌ Error reading package.json: ${error.message}`, colors.red);
    return false;
  }
}

function checkCommand(command, description) {
  try {
    execSync(command, { stdio: 'pipe' });
    log(`✅ ${description}`, colors.green);
    return true;
  } catch (error) {
    log(`❌ ${description}: ${error.message}`, colors.red);
    return false;
  }
}

function checkWorkflowFile(filePath) {
  if (!existsSync(filePath)) {
    log(`❌ Workflow file missing: ${filePath}`, colors.red);
    return false;
  }

  try {
    const content = readFileSync(filePath, 'utf8');
    const checks = [
      { pattern: /on:\s*\n/, description: 'Has trigger events' },
      { pattern: /jobs:\s*\n/, description: 'Has jobs defined' },
      {
        pattern: /runs-on:\s*ubuntu-latest/,
        description: 'Uses Ubuntu runner',
      },
      {
        pattern: /actions\/checkout@v4/,
        description: 'Uses latest checkout action',
      },
      {
        pattern: /actions\/setup-node@v4/,
        description: 'Uses latest Node.js setup',
      },
    ];

    let allPassed = true;
    log(`\n📋 Checking workflow: ${filePath}`, colors.blue);

    checks.forEach((check) => {
      const passed = check.pattern.test(content);
      log(
        `  ${passed ? '✅' : '❌'} ${check.description}`,
        passed ? colors.green : colors.red
      );
      if (!passed) allPassed = false;
    });

    return allPassed;
  } catch (error) {
    log(`❌ Error reading workflow file: ${error.message}`, colors.red);
    return false;
  }
}

function main() {
  log(
    `${colors.bold}${colors.blue}🚀 HUNKCentral CI/CD Setup Verification${colors.reset}\n`
  );

  let allChecks = [];

  // Check essential files
  log(`${colors.bold}📁 Essential Files${colors.reset}`);
  allChecks.push(checkFile('package.json', 'Package configuration'));
  allChecks.push(checkFile('tsconfig.json', 'TypeScript configuration'));
  allChecks.push(checkFile('next.config.js', 'Next.js configuration'));
  allChecks.push(checkFile('tailwind.config.ts', 'Tailwind CSS configuration'));
  allChecks.push(checkFile('prisma/schema.prisma', 'Prisma schema'));
  allChecks.push(checkFile('.env.example', 'Environment variables example'));

  // Check CI/CD workflow files
  log(`\n${colors.bold}⚙️ GitHub Actions Workflows${colors.reset}`);
  allChecks.push(
    checkFile('.github/workflows/ci-cd.yml', 'Main CI/CD workflow')
  );
  allChecks.push(checkFile('.github/workflows/ci.yml', 'Basic CI workflow'));
  allChecks.push(
    checkFile(
      '.github/workflows/vercel-deployment.yml',
      'Vercel deployment workflow'
    )
  );
  allChecks.push(
    checkFile(
      '.github/workflows/dependency-update.yml',
      'Dependency update workflow'
    )
  );

  // Check workflow file contents
  allChecks.push(checkWorkflowFile('.github/workflows/ci-cd.yml'));
  allChecks.push(checkWorkflowFile('.github/workflows/ci.yml'));
  allChecks.push(checkWorkflowFile('.github/workflows/vercel-deployment.yml'));

  // Check package.json scripts
  log(`\n${colors.bold}📜 Package Scripts${colors.reset}`);
  allChecks.push(checkPackageScript('build', 'Build script'));
  allChecks.push(checkPackageScript('lint', 'Linting script'));
  allChecks.push(checkPackageScript('type-check', 'Type checking script'));
  allChecks.push(checkPackageScript('test', 'Test script'));
  allChecks.push(checkPackageScript('test:coverage', 'Test coverage script'));
  allChecks.push(checkPackageScript('test:e2e', 'E2E test script'));

  // Check development tools
  log(`\n${colors.bold}🛠️ Development Tools${colors.reset}`);
  allChecks.push(checkCommand('npx eslint --version', 'ESLint installed'));
  allChecks.push(checkCommand('npx tsc --version', 'TypeScript installed'));
  allChecks.push(checkCommand('npx prettier --version', 'Prettier installed'));
  allChecks.push(checkCommand('npx prisma --version', 'Prisma CLI installed'));

  // Check testing tools
  log(`\n${colors.bold}🧪 Testing Tools${colors.reset}`);
  allChecks.push(checkCommand('npx vitest --version', 'Vitest installed'));
  allChecks.push(
    checkCommand('npx playwright --version', 'Playwright installed')
  );

  // Check documentation
  log(`\n${colors.bold}📚 Documentation${colors.reset}`);
  allChecks.push(checkFile('README.md', 'Project README'));
  allChecks.push(
    checkFile('docs/github-secrets.md', 'GitHub secrets documentation')
  );
  allChecks.push(checkFile('README-VERCEL-SETUP.md', 'Vercel setup guide'));

  // Check configuration files
  log(`\n${colors.bold}⚙️ Configuration Files${colors.reset}`);
  allChecks.push(checkFile('eslint.config.js', 'ESLint configuration'));
  allChecks.push(checkFile('.prettierrc', 'Prettier configuration'));
  allChecks.push(checkFile('vitest.config.ts', 'Vitest configuration'));
  allChecks.push(checkFile('playwright.config.ts', 'Playwright configuration'));

  // Summary
  const passedChecks = allChecks.filter(Boolean).length;
  const totalChecks = allChecks.length;
  const percentage = Math.round((passedChecks / totalChecks) * 100);

  log(`\n${colors.bold}📊 Summary${colors.reset}`);
  log(
    `Passed: ${passedChecks}/${totalChecks} (${percentage}%)`,
    percentage >= 90
      ? colors.green
      : percentage >= 70
        ? colors.yellow
        : colors.red
  );

  if (percentage >= 90) {
    log(
      `\n🎉 Excellent! Your CI/CD setup is comprehensive and ready for production.`,
      colors.green
    );
  } else if (percentage >= 70) {
    log(
      `\n⚠️  Good setup, but some components are missing. Review the failed checks above.`,
      colors.yellow
    );
  } else {
    log(
      `\n🚨 CI/CD setup needs significant work. Please address the failed checks above.`,
      colors.red
    );
  }

  // Recommendations
  log(`\n${colors.bold}💡 Next Steps${colors.reset}`);
  if (percentage < 100) {
    log('1. Address any failed checks above');
    log('2. Set up required GitHub secrets (see docs/github-secrets.md)');
    log('3. Test the CI/CD pipeline with a pull request');
    log('4. Configure Vercel environment variables');
    log('5. Set up monitoring and alerting');
  } else {
    log('1. Set up required GitHub secrets (see docs/github-secrets.md)');
    log('2. Test the CI/CD pipeline with a pull request');
    log('3. Configure production environment variables');
    log('4. Set up monitoring and alerting');
    log('5. Schedule regular security audits');
  }

  process.exit(percentage >= 90 ? 0 : 1);
}

main();
