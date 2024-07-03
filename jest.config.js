module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.spec.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  setupFilesAfterEnv: ['./test/setup.js'],
  detectOpenHandles: true
}
