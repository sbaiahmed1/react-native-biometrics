module.exports = {
  preset: 'react-native',
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.ts?(x)',
    '<rootDir>/plugin/src/__tests__/**/*.test.ts',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
};
