// .eslintrc.cjs
module.exports = {
  root: true,
  env: { es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'playwright'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  ignorePatterns: ['node_modules/', 'dist/', 'build/', 'coverage/', 'playwright-report/', 'traces/', 'extensions/'],

  rules: {
    'no-debugger': 'error',
    'no-console': ['error', { allow: ['warn', 'error'] }],
  },

  overrides: [
    // Tests (only under src/)
    {
      files: ['src/tests/**/*.{ts,tsx,js}', 'src/**/*.spec.{ts,tsx,js}', 'src/**/*test.{ts,tsx,js}'],
      extends: ['plugin:playwright/recommended'],
      rules: {
        'no-restricted-properties': ['error', { object: 'page', property: 'pause', message: 'Remove page.pause()' }],
        // relax ergonomics in tests
        'playwright/no-skipped-test': 'off',
        'playwright/valid-title': 'off',
        'playwright/expect-expect': 'off',
        'playwright/no-conditional-in-test': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      },
    },

    // Allow console in logger utils (still under src/)
    {
      files: ['src/utils/logger/**/*.{ts,tsx,js}'],
      rules: { 'no-console': 'off' },
    },

    // Datadog util: relax noisy TS rules
    {
      files: ['src/utils/datadog/**/*.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      },
    },
  ],
};
