/**
 * Comprehensive test runner for HUNKCentral
 * Runs all test suites and generates coverage reports
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

interface TestSuite {
  name: string;
  pattern: string;
  description: string;
  timeout?: number;
}

const testSuites: TestSuite[] = [
  {
    name: 'Unit Tests',
    pattern: '__tests__/**/*.test.ts',
    description: 'Individual component and function tests',
  },
  {
    name: 'Integration Tests',
    pattern: '__tests__/integration/**/*.test.ts',
    description: 'Multi-component workflow tests',
    timeout: 30000,
  },
  {
    name: 'Edge Cases',
    pattern: '__tests__/edge-cases/**/*.test.ts',
    description: 'Boundary conditions and error scenarios',
  },
  {
    name: 'E2E Tests',
    pattern: '__tests__/e2e/**/*.test.ts',
    description: 'End-to-end user journey tests',
    timeout: 60000,
  },
];

interface TestResults {
  suite: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

class TestRunner {
  private results: TestResults[] = [];
  private startTime: number = 0;

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting HUNKCentral Comprehensive Test Suite\n');
    this.startTime = Date.now();

    // Ensure test directories exist
    this.ensureTestDirectories();

    // Run each test suite
    for (const suite of testSuites) {
      await this.runTestSuite(suite);
    }

    // Generate final report
    this.generateFinalReport();
  }

  private ensureTestDirectories(): void {
    const directories = [
      '__tests__/integration',
      '__tests__/e2e',
      '__tests__/edge-cases',
      '__tests__/performance',
      'coverage',
    ];

    directories.forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`\n📋 Running ${suite.name}`);
    console.log(`   ${suite.description}`);
    console.log(`   Pattern: ${suite.pattern}\n`);

    const startTime = Date.now();
    let result: TestResults;

    try {
      // Build vitest command
      const timeout = suite.timeout ? `--testTimeout=${suite.timeout}` : '';
      const command = `npx vitest run ${suite.pattern} ${timeout} --reporter=json --coverage`;

      // Run tests
      const output = execSync(command, { 
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Parse results
      result = this.parseTestOutput(output, suite.name);
      
    } catch (error: any) {
      // Handle test failures
      result = this.parseTestOutput(error.stdout || '', suite.name);
      if (result.failed === 0 && result.passed === 0) {
        // No tests found or parsing failed
        result = {
          suite: suite.name,
          passed: 0,
          failed: 1,
          skipped: 0,
          duration: Date.now() - startTime,
        };
      }
    }

    result.duration = Date.now() - startTime;
    this.results.push(result);

    // Print suite results
    this.printSuiteResults(result);
  }

  private parseTestOutput(output: string, suiteName: string): TestResults {
    try {
      // Try to parse JSON output from vitest
      const lines = output.split('\n');
      const jsonLine = lines.find(line => line.trim().startsWith('{'));
      
      if (jsonLine) {
        const testResult = JSON.parse(jsonLine);
        
        return {
          suite: suiteName,
          passed: testResult.numPassedTests || 0,
          failed: testResult.numFailedTests || 0,
          skipped: testResult.numPendingTests || 0,
          duration: testResult.testResults?.reduce((sum: number, test: any) => 
            sum + (test.perfStats?.runtime || 0), 0) || 0,
        };
      }
    } catch (error) {
      console.warn(`Failed to parse test output for ${suiteName}:`, error);
    }

    // Fallback: parse text output
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    const skippedMatch = output.match(/(\d+) skipped/);

    return {
      suite: suiteName,
      passed: passedMatch ? parseInt(passedMatch[1]) : 0,
      failed: failedMatch ? parseInt(failedMatch[1]) : 0,
      skipped: skippedMatch ? parseInt(skippedMatch[1]) : 0,
      duration: 0,
    };
  }

  private printSuiteResults(result: TestResults): void {
    const total = result.passed + result.failed + result.skipped;
    const passRate = total > 0 ? ((result.passed / total) * 100).toFixed(1) : '0.0';
    
    console.log(`✅ Passed: ${result.passed}`);
    console.log(`❌ Failed: ${result.failed}`);
    console.log(`⏭️  Skipped: ${result.skipped}`);
    console.log(`📊 Pass Rate: ${passRate}%`);
    console.log(`⏱️  Duration: ${(result.duration / 1000).toFixed(2)}s`);
    
    if (result.coverage) {
      console.log(`📈 Coverage: ${result.coverage.lines}% lines, ${result.coverage.functions}% functions`);
    }
  }

  private generateFinalReport(): void {
    const totalDuration = Date.now() - this.startTime;
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const totalSkipped = this.results.reduce((sum, r) => sum + r.skipped, 0);
    const totalTests = totalPassed + totalFailed + totalSkipped;
    const overallPassRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';

    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE TEST SUITE RESULTS');
    console.log('='.repeat(60));

    // Suite breakdown
    this.results.forEach(result => {
      const total = result.passed + result.failed + result.skipped;
      const rate = total > 0 ? ((result.passed / total) * 100).toFixed(1) : '0.0';
      const status = result.failed === 0 ? '✅' : '❌';
      
      console.log(`${status} ${result.suite.padEnd(20)} ${result.passed}/${total} (${rate}%)`);
    });

    console.log('\n' + '-'.repeat(60));
    console.log(`📈 OVERALL RESULTS:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${totalPassed} (${overallPassRate}%)`);
    console.log(`   Failed: ${totalFailed}`);
    console.log(`   Skipped: ${totalSkipped}`);
    console.log(`   Duration: ${(totalDuration / 1000).toFixed(2)}s`);

    // Generate test report file
    this.generateTestReport();

    // Final status
    if (totalFailed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! System is ready for production.');
    } else {
      console.log(`\n⚠️  ${totalFailed} tests failed. Please review and fix before deployment.`);
      process.exit(1);
    }
  }

  private generateTestReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.reduce((sum, r) => sum + r.passed + r.failed + r.skipped, 0),
        passed: this.results.reduce((sum, r) => sum + r.passed, 0),
        failed: this.results.reduce((sum, r) => sum + r.failed, 0),
        skipped: this.results.reduce((sum, r) => sum + r.skipped, 0),
        duration: Date.now() - this.startTime,
      },
      suites: this.results,
      requirements: {
        'Integration Tests': this.results.find(r => r.suite === 'Integration Tests')?.passed || 0,
        'E2E Tests': this.results.find(r => r.suite === 'E2E Tests')?.passed || 0,
        'Edge Cases': this.results.find(r => r.suite === 'Edge Cases')?.passed || 0,
        'Business Logic': this.results.find(r => r.suite === 'Unit Tests')?.passed || 0,
      },
    };

    const reportPath = join('coverage', 'test-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { TestRunner, type TestResults };