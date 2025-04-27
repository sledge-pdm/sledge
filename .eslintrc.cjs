/** @type {import("eslint").Linter.Config} */

module.exports = {
  root: true,
  env: { browser: true, es2024: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { project: './tsconfig.json', tsconfigRootDir: __dirname },
  plugins: ['@typescript-eslint', 'solid', 'import'],
  extends: ['eslint:recommended', 'plugin:solid/typescript'],
  rules: {
    'solid/jsx-no-undef': 'error',
    'unused-imports/no-unused-imports': 'warn',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-empty-object-type': 'off',
    'import/order': ['warn', { alphabetize: { order: 'asc' } }],
    'prettier/prettier': ['error', {}, { usePrettierrc: true }],
  },
  ignorePatterns: ['./dist*', './node_modules', 'src-tauri/**/target', '*.d.ts'],
};
