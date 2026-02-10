module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  moduleFileExtensions: ['js'],
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/app.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true
};
