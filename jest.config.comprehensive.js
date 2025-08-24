// Comprehensive test configuration for export system
module.exports = {
  // Extend the default Create React App Jest configuration
  ...require('./node_modules/react-scripts/scripts/utils/createJestConfig.js')(__dirname),
  
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.ts',
    '<rootDir>/src/__tests__/setup/testSetup.ts'
  ],
  
  // Test patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
    '<rootDir>/src/__tests__/integration/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/__tests__/performance/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/__tests__/security/**/*.test.{js,jsx,ts,tsx}'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/__tests__/**',
    '!src/**/*.stories.{js,jsx,ts,tsx}'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Stricter thresholds for critical components
    './src/services/ComplianceChecker.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/services/DataPersistenceService.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/components/ComplianceChecker.tsx': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@pages/(.*)$': '<rootDir>/src/pages/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    '^.+\\.css$': 'jest-transform-css',
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': 'jest-transform-file'
  },
  
  // Test timeout for integration tests
  testTimeout: 30000,
  
  // Reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-results',
        outputName: 'junit.xml',
        suiteName: 'Export System Tests'
      }
    ],
    [
      'jest-html-reporters',
      {
        publicPath: './test-results',
        filename: 'test-report.html',
        expand: true
      }
    ]
  ],
  
  // Global setup and teardown
  globalSetup: '<rootDir>/src/__tests__/setup/globalSetup.ts',
  globalTeardown: '<rootDir>/src/__tests__/setup/globalTeardown.ts',
  
  // Mock configuration
  clearMocks: true,
  restoreMocks: true,
  
  // Performance monitoring
  maxWorkers: '50%',
  
  // Test categories
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}'
      ],
      testPathIgnorePatterns: [
        '<rootDir>/src/__tests__/integration/',
        '<rootDir>/src/__tests__/performance/',
        '<rootDir>/src/__tests__/security/',
        '<rootDir>/src/__tests__/e2e/'
      ]
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/src/__tests__/integration/**/*.test.{js,jsx,ts,tsx}'],
      testTimeout: 60000
    },
    {
      displayName: 'Performance Tests',
      testMatch: ['<rootDir>/src/__tests__/performance/**/*.test.{js,jsx,ts,tsx}'],
      testTimeout: 120000
    },
    {
      displayName: 'Security Tests',
      testMatch: ['<rootDir>/src/__tests__/security/**/*.test.{js,jsx,ts,tsx}'],
      testTimeout: 60000
    }
  ]
};