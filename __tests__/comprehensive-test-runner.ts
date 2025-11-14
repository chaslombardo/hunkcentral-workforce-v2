#!/usr/bin/env tsx

/**
 * Comprehensive Test Runner for Theme & UX Improvements
 *
 * This script runs all tests related to the theme and UX improvements
 * and generates a comprehensive report of the testing results.
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface TestResult {
  category: string;
  passed: number;
  failed: number;
  total: number;
  duration: number;
  coverage?: number;
}

interface TestReport {
  timestamp: string;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  overallDuration: number;
  categories: TestResult[];
  summary: string;
}

class ComprehensiveTestRunner {
  private results: TestResult[] = [];
  private startTime: number = Date.now();

  async runTestCategory(
    category: string,
    pattern: string
  ): Promise<TestResult> {
    console.log(`\n🧪 Running ${category} tests...`);

    const startTime = Date.now();
    let passed = 0;
    let failed = 0;
    let total = 0;

    try {
      const output = execSync(`npm run test -- --run ${pattern}`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });

      // Parse vitest output to extract test results
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.includes('Tests ')) {
          const match = line.match(/(\d+) failed \| (\d+) passed \((\d+)\)/);
          if (match) {
            failed = parseInt(match[1]);
            passed = parseInt(match[2]);
            total = parseInt(match[3]);
          } else {
            const passMatch = line.match(/(\d+) passed/);
            if (passMatch) {
              passed = parseInt(passMatch[1]);
              total = passed;
              failed = 0;
            }
          }
        }
      }

      console.log(`✅ ${category}: ${passed}/${total} tests passed`);
    } catch (error: any) {
      // Parse error output for test results
      const output = error.stdout || error.message;
      const lines = output.split('\n');

      for (const line of lines) {
        if (line.includes('Tests ')) {
          const match = line.match(/(\d+) failed \| (\d+) passed \((\d+)\)/);
          if (match) {
            failed = parseInt(match[1]);
            passed = parseInt(match[2]);
            total = parseInt(match[3]);
          }
        }
      }

      console.log(
        `❌ ${category}: ${passed}/${total} tests passed, ${failed} failed`
      );
    }

    const duration = Date.now() - startTime;

    return {
      category,
      passed,
      failed,
      total,
      duration,
    };
  }

  async runLintingAndTypeChecking(): Promise<TestResult> {
    console.log('\n🔍 Running linting and type checking...');

    const startTime = Date.now();
    let passed = 0;
    let failed = 0;

    try {
      execSync('npm run lint', { stdio: 'pipe' });
      passed++;
      console.log('✅ Linting passed');
    } catch (error) {
      failed++;
      console.log('❌ Linting failed');
    }

    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      passed++;
      console.log('✅ Type checking passed');
    } catch (error) {
      failed++;
      console.log('❌ Type checking failed');
    }

    const duration = Date.now() - startTime;

    return {
      category: 'Code Quality',
      passed,
      failed,
      total: passed + failed,
      duration,
    };
  }

  async runAllTests(): Promise<TestReport> {
    console.log(
      '🚀 Starting Comprehensive Test Suite for Theme & UX Improvements\n'
    );

    // Run different test categories
    const testCategories = [
      {
        name: 'Brand Components',
        pattern: '__tests__/components/brand-*.test.tsx',
      },
      {
        name: 'Form Components',
        pattern: '__tests__/components/*form*.test.tsx',
      },
      {
        name: 'Visual Consistency',
        pattern: '__tests__/visual/*.test.tsx',
      },
      {
        name: 'Navigation Integration',
        pattern: '__tests__/integration/navigation-*.test.tsx',
      },
      {
        name: 'Accessibility',
        pattern: '__tests__/accessibility/*.test.tsx',
      },
      {
        name: 'Existing Components',
        pattern:
          '__tests__/components/accessibility-enhancements.test.tsx __tests__/components/smart-input.test.tsx',
      },
    ];

    // Run each test category
    for (const category of testCategories) {
      try {
        const result = await this.runTestCategory(
          category.name,
          category.pattern
        );
        this.results.push(result);
      } catch (error) {
        console.error(`Error running ${category.name} tests:`, error);
        this.results.push({
          category: category.name,
          passed: 0,
          failed: 1,
          total: 1,
          duration: 0,
        });
      }
    }

    // Run code quality checks
    const codeQualityResult = await this.runLintingAndTypeChecking();
    this.results.push(codeQualityResult);

    // Generate report
    const totalDuration = Date.now() - this.startTime;
    const totalTests = this.results.reduce((sum, r) => sum + r.total, 0);
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);

    const report: TestReport = {
      timestamp: new Date().toISOString(),
      totalTests,
      totalPassed,
      totalFailed,
      overallDuration: totalDuration,
      categories: this.results,
      summary: this.generateSummary(totalTests, totalPassed, totalFailed),
    };

    return report;
  }

  private generateSummary(
    total: number,
    passed: number,
    failed: number
  ): string {
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    let summary = `\n📊 COMPREHENSIVE TEST RESULTS SUMMARY\n`;
    summary += `${'='.repeat(50)}\n\n`;
    summary += `Total Tests: ${total}\n`;
    summary += `Passed: ${passed} (${passRate}%)\n`;
    summary += `Failed: ${failed}\n`;
    summary += `Overall Duration: ${Math.round(this.results.reduce((sum, r) => sum + r.duration, 0) / 1000)}s\n\n`;

    summary += `📋 CATEGORY BREAKDOWN:\n`;
    summary += `${'-'.repeat(30)}\n`;

    for (const result of this.results) {
      const categoryPassRate =
        result.total > 0 ? Math.round((result.passed / result.total) * 100) : 0;
      const status = result.failed === 0 ? '✅' : '❌';
      summary += `${status} ${result.category}: ${result.passed}/${result.total} (${categoryPassRate}%) - ${Math.round(result.duration / 1000)}s\n`;
    }

    summary += `\n🎯 THEME & UX IMPROVEMENTS TESTING STATUS:\n`;
    summary += `${'-'.repeat(40)}\n`;

    if (failed === 0) {
      summary += `🎉 ALL TESTS PASSING! Theme and UX improvements are ready for production.\n`;
    } else if (passRate >= 80) {
      summary += `⚠️  Most tests passing (${passRate}%). Review failed tests before deployment.\n`;
    } else {
      summary += `🚨 Significant test failures (${passRate}% pass rate). Address issues before proceeding.\n`;
    }

    summary += `\n📈 COVERAGE AREAS TESTED:\n`;
    summary += `${'-'.repeat(25)}\n`;
    summary += `• Brand Visual Identity (Colors, Typography, Spacing)\n`;
    summary += `• Enhanced Navigation (Breadcrumbs, Mobile, State Management)\n`;
    summary += `• Form Interactions (Validation, Mobile Optimization)\n`;
    summary += `• Accessibility (Keyboard, Screen Reader, ARIA)\n`;
    summary += `• Visual Consistency (Cross-component, Responsive)\n`;
    summary += `• Code Quality (Linting, Type Safety)\n`;

    return summary;
  }

  async generateReport(report: TestReport): Promise<void> {
    // Console output
    console.log(report.summary);

    // Write detailed JSON report
    const jsonReport = JSON.stringify(report, null, 2);
    const reportPath = join(
      process.cwd(),
      '__tests__',
      'comprehensive-test-report.json'
    );
    writeFileSync(reportPath, jsonReport);
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    // Write markdown report
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = join(
      process.cwd(),
      '__tests__',
      'comprehensive-test-report.md'
    );
    writeFileSync(markdownPath, markdownReport);
    console.log(`📄 Markdown report saved to: ${markdownPath}`);
  }

  private generateMarkdownReport(report: TestReport): string {
    const passRate =
      report.totalTests > 0
        ? Math.round((report.totalPassed / report.totalTests) * 100)
        : 0;

    let markdown = `# Comprehensive Test Report - Theme & UX Improvements\n\n`;
    markdown += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n\n`;

    markdown += `## Summary\n\n`;
    markdown += `| Metric | Value |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Total Tests | ${report.totalTests} |\n`;
    markdown += `| Passed | ${report.totalPassed} |\n`;
    markdown += `| Failed | ${report.totalFailed} |\n`;
    markdown += `| Pass Rate | ${passRate}% |\n`;
    markdown += `| Duration | ${Math.round(report.overallDuration / 1000)}s |\n\n`;

    markdown += `## Test Categories\n\n`;
    for (const result of report.categories) {
      const categoryPassRate =
        result.total > 0 ? Math.round((result.passed / result.total) * 100) : 0;
      const status = result.failed === 0 ? '✅' : '❌';

      markdown += `### ${status} ${result.category}\n\n`;
      markdown += `- **Tests:** ${result.total}\n`;
      markdown += `- **Passed:** ${result.passed}\n`;
      markdown += `- **Failed:** ${result.failed}\n`;
      markdown += `- **Pass Rate:** ${categoryPassRate}%\n`;
      markdown += `- **Duration:** ${Math.round(result.duration / 1000)}s\n\n`;
    }

    markdown += `## Coverage Areas\n\n`;
    markdown += `This comprehensive test suite validates:\n\n`;
    markdown += `- ✅ **Brand Visual Identity**: College Hunks colors, typography, spacing consistency\n`;
    markdown += `- ✅ **Enhanced Navigation**: Smart breadcrumbs, unified mobile navigation, state management\n`;
    markdown += `- ✅ **Form Interactions**: Progressive validation, mobile optimization, smart inputs\n`;
    markdown += `- ✅ **Accessibility**: Keyboard navigation, screen reader support, ARIA compliance\n`;
    markdown += `- ✅ **Visual Consistency**: Cross-component styling, responsive design\n`;
    markdown += `- ✅ **Code Quality**: ESLint compliance, TypeScript type safety\n\n`;

    markdown += `## Recommendations\n\n`;
    if (report.totalFailed === 0) {
      markdown += `🎉 **All tests passing!** The theme and UX improvements are ready for production deployment.\n\n`;
    } else if (passRate >= 80) {
      markdown += `⚠️ **Review required**: ${report.totalFailed} test(s) failing. Review and fix before deployment.\n\n`;
    } else {
      markdown += `🚨 **Action required**: Significant test failures detected. Address issues before proceeding.\n\n`;
    }

    markdown += `## Next Steps\n\n`;
    markdown += `1. Review any failing tests and fix underlying issues\n`;
    markdown += `2. Run E2E tests to validate complete user journeys\n`;
    markdown += `3. Perform manual accessibility testing with screen readers\n`;
    markdown += `4. Validate cross-browser compatibility\n`;
    markdown += `5. Monitor performance impact in staging environment\n`;

    return markdown;
  }
}

// Run the comprehensive test suite
async function main() {
  const runner = new ComprehensiveTestRunner();

  try {
    const report = await runner.runAllTests();
    await runner.generateReport(report);

    // Exit with appropriate code
    process.exit(report.totalFailed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

// Check if this file is being run directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main();
}

export { ComprehensiveTestRunner };
