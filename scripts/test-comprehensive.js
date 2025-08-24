#!/usr/bin/env node

// Comprehensive test runner script
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const testTypes = {
  unit: {
    name: 'Unit Tests',
    command: 'npm',
    args: ['test', '--', '--testPathPattern=src/.*/__tests__/.*\\.test\\.(js|jsx|ts|tsx)$', '--testPathIgnorePatterns=integration|performance|security|e2e', '--watchAll=false'],
    timeout: 300000 // 5 minutes
  },
  integration: {
    name: 'Integration Tests',
    command: 'npm',
    args: ['test', '--', '--testPathPattern=src/__tests__/integration/.*\\.test\\.(js|jsx|ts|tsx)$', '--watchAll=false'],
    timeout: 600000 // 10 minutes
  },
  performance: {
    name: 'Performance Tests',
    command: 'npm',
    args: ['test', '--', '--testPathPattern=src/__tests__/performance/.*\\.test\\.(js|jsx|ts|tsx)$', '--watchAll=false'],
    timeout: 900000 // 15 minutes
  },
  security: {
    name: 'Security Tests',
    command: 'npm',
    args: ['test', '--', '--testPathPattern=src/__tests__/security/.*\\.test\\.(js|jsx|ts|tsx)$', '--watchAll=false'],
    timeout: 600000 // 10 minutes
  },
  e2e: {
    name: 'End-to-End Tests',
    command: 'npx',
    args: ['playwright', 'test', 'src/__tests__/e2e/'],
    timeout: 1200000 // 20 minutes
  }
};

async function runTest(testType, config) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Running ${config.name}...`);
    console.log(`Command: ${config.command} ${config.args.join(' ')}\n`);

    const startTime = Date.now();
    const child = spawn(config.command, config.args, {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd()
    });

    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`${config.name} timed out after ${config.timeout / 1000} seconds`));
    }, config.timeout);

    child.on('close', (code) => {
      clearTimeout(timeout);
      const duration = Date.now() - startTime;
      
      if (code === 0) {
        console.log(`\n✅ ${config.name} completed successfully in ${Math.round(duration / 1000)}s`);
        resolve({ testType, success: true, duration, code });
      } else {
        console.log(`\n❌ ${config.name} failed with exit code ${code} after ${Math.round(duration / 1000)}s`);
        resolve({ testType, success: false, duration, code });
      }
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      console.error(`\n💥 ${config.name} encountered an error:`, error.message);
      reject(error);
    });
  });
}

async function generateTestReport(results) {
  const reportPath = path.join(process.cwd(), 'test-results', 'comprehensive-report.json');
  const reportDir = path.dirname(reportPath);

  // Ensure report directory exists
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => r.success === false).length,
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0)
    },
    results: results.map(result => ({
      testType: result.testType,
      name: testTypes[result.testType].name,
      success: result.success,
      duration: result.duration,
      exitCode: result.code
    }))
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📊 Test report generated: ${reportPath}`);

  return report;
}

function printSummary(report) {
  console.log('\n' + '='.repeat(60));
  console.log('📋 COMPREHENSIVE TEST SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`Total Tests: ${report.summary.total}`);
  console.log(`✅ Passed: ${report.summary.passed}`);
  console.log(`❌ Failed: ${report.summary.failed}`);
  console.log(`⏱️  Total Duration: ${Math.round(report.summary.totalDuration / 1000)}s`);
  
  console.log('\nDetailed Results:');
  report.results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const duration = Math.round(result.duration / 1000);
    console.log(`  ${status} ${result.name}: ${duration}s`);
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (report.summary.failed > 0) {
    console.log('❌ Some tests failed. Check the logs above for details.');
    process.exit(1);
  } else {
    console.log('🎉 All tests passed successfully!');
    process.exit(0);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const requestedTests = args.length > 0 ? args : Object.keys(testTypes);
  
  console.log('🚀 Starting Comprehensive Test Suite');
  console.log(`Running test types: ${requestedTests.join(', ')}`);
  
  const results = [];
  
  for (const testType of requestedTests) {
    if (!testTypes[testType]) {
      console.error(`❌ Unknown test type: ${testType}`);
      console.log(`Available test types: ${Object.keys(testTypes).join(', ')}`);
      process.exit(1);
    }
    
    try {
      const result = await runTest(testType, testTypes[testType]);
      results.push(result);
    } catch (error) {
      console.error(`💥 Failed to run ${testType} tests:`, error.message);
      results.push({
        testType,
        success: false,
        duration: 0,
        code: -1,
        error: error.message
      });
    }
  }
  
  // Generate and display report
  const report = await generateTestReport(results);
  printSummary(report);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test suite interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test suite terminated');
  process.exit(143);
});

// Run the main function
main().catch(error => {
  console.error('💥 Test runner encountered a fatal error:', error);
  process.exit(1);
});