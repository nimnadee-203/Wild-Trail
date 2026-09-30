const expo = require('eslint-config-expo');

module.exports = [
  {
    ignores: ['node_modules/**', '.expo/**', 'dist/**', 'build/**'],
  },
  ...(Array.isArray(expo) ? expo : [expo]),
];
