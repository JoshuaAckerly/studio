// Note: noteleks JS tests have been moved to the standalone noteleks project.
// Studio has no JavaScript unit tests — this file is kept as a placeholder.
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/resources/js'],
  moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
};
