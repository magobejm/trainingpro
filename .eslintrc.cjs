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
      files: ['apps/api/**/*.prisma*.ts'],
      rules: {
        'max-lines': 'off',
        'max-lines-per-function': 'off',
      },
    },
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
            selector: [
              "JSXAttribute[value.type='Literal']",
              ":not([name.name='testID'])",
              ":not([name.name='accessibilityLabel'])",
              ":not([name.name='aria-label'])",
              ":not([name.name='accessibilityRole'])",
              // props de enumeración de las primitivas de @trainerpro/ui (no son texto de interfaz)
              ":not([name.name='variant'])",
              ":not([name.name='size'])",
              ":not([name.name='tone'])",
            ].join(''),
            message: 'Use i18n keys for string props (except testID, labels, and accessibilityRole).',
          },
        ],
      },
    },
    {
      files: ['apps/web/src/**/*.{ts,tsx}'],
      excludedFiles: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: "JSXText[value=/\\S+/]",
            message: 'Use i18n keys, no literal strings in JSX text.',
          },
          {
            selector: [
              "JSXAttribute[value.type='Literal']",
              ":not([name.name='testID'])",
              ":not([name.name='accessibilityLabel'])",
              ":not([name.name='aria-label'])",
              ":not([name.name='accessibilityRole'])",
              ":not([name.name='variant'])",
              ":not([name.name='size'])",
              ":not([name.name='tone'])",
            ].join(''),
            message: 'Use i18n keys for string props (except testID, labels, and accessibilityRole).',
          },
          {
            selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
            message: 'Usa un token de packages/ui/src/theme en lugar de un color hexadecimal.',
          },
        ],
      },
    },
    {
      files: ['packages/ui/src/**/*.{ts,tsx,js,jsx}'],
      excludedFiles: ['packages/ui/src/theme/**'],
      rules: {
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
          {
            selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
            message: 'Usa un token de packages/ui/src/theme en lugar de un color hexadecimal.',
          },
        ],
      },
    },
  ],
};
