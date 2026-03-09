module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  env: {
    es2022: true,
    node: true,
  },
  ignorePatterns: ['dist/', 'build/', '.expo/', 'node_modules/'],
  rules: {
    'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['error', { max: 100, skipBlankLines: true, skipComments: true }],
    'max-len': ['error', { code: 125, ignoreUrls: true, ignoreStrings: true, ignoreRegExpLiterals: true }],
  },
  overrides: [
    {
      files: ['packages/ui/**/*.{ts,tsx,js,jsx}'],
      rules: {
        'no-restricted-globals': ['error', 'fetch'],
        'no-restricted-imports': [
          'error',
          {
            paths: [
              { name: 'axios', message: 'No API calls in packages/ui.' },
              { name: 'graphql-request', message: 'No API calls in packages/ui.' },
            ],
            patterns: ['**/data/**', '**/api/**'],
          },
        ],
        'no-restricted-syntax': [
          'error',
          {
            selector: "CallExpression[callee.property.name='get']",
            message: 'No network API client calls in packages/ui.',
          },
          {
            selector: "CallExpression[callee.property.name='post']",
            message: 'No network API client calls in packages/ui.',
          },
        ],
      },
    },
    {
      files: ['apps/mobile/**/*.{ts,tsx}', 'apps/web/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: "JSXText[value=/\\S+/]",
            message: 'Use i18n keys, no literal strings in JSX text.',
          },
          {
            selector:
              "JSXAttribute[value.type='Literal']:not([name.name='testID']):not([name.name='accessibilityLabel']):not([name.name='aria-label'])",
            message: 'Use i18n keys for string props (except testID/accessibilityLabel/aria-label).',
          },
        ],
      },
    },
  ],
};
