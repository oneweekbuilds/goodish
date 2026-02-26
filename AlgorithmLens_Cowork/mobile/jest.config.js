/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  // React Native defines __DEV__ globally; replicate it for Jest
  globals: {
    __DEV__: true,
  },
  // Don't try to resolve native modules
  moduleNameMapper: {
    '^expo-modules-core$': '<rootDir>/src/__tests__/__mocks__/expo-modules-core.ts',
    '^expo-haptics$': '<rootDir>/src/__tests__/__mocks__/expo-haptics.ts',
    '^@react-native-async-storage/async-storage$': '<rootDir>/src/__tests__/__mocks__/async-storage.ts',
    '^@sentry/react-native$': '<rootDir>/src/__tests__/__mocks__/sentry-react-native.ts',
    '^expo-constants$': '<rootDir>/src/__tests__/__mocks__/expo-constants.ts',
    '^react-native$': '<rootDir>/src/__tests__/__mocks__/react-native.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!expo-|@expo/|react-native|@react-native)',
  ],
};
