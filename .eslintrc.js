module.exports = {
  root: true,
  env: { node: true, es2022: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.json'],
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  settings: { 'import/resolver': { typescript: {} } },
  ignorePatterns: [
    'packages/**/*',
    'dist/**/*',
    ".eslintrc.js",
    'node_modules/**/*',
    'uploads/**/*',
    'uploads-*/**/*'
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-misused-promises': 'error',
  },
};

