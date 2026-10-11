const base = require('./jest.config.cjs');

module.exports = {
  ...base,
  testRegex: 'test/perf/measure\\.perf\\.ts$',
};
