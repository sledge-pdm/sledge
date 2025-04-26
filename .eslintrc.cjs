/** @type {import("eslint").Linter.Config} */

module.exports = {
  root: true,
  env: { browser: true, es2024: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { project: './tsconfig.json', tsconfigRootDir: __dirname },
  plugins: ['@typescript-eslint', 'solid', 'unused-imports', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:solid/typescript',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
  ],
  rules: {
    'solid/jsx-no-undef': 'error',
    'unused-imports/no-unused-imports': 'warn',
    'import/order': ['warn', { alphabetize: { order: 'asc' } }],
    'prettier/prettier': ['error', {}, { usePrettierrc: true }],
  },
  ignorePatterns: ['./dist*', './node_modules', 'src-tauri/**/target', '*.d.ts'],
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
};
