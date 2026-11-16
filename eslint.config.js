// @ts-check
// Lint rules for TypeScript, React islands and Astro components. Formatting is Prettier's job, not ESLint's.
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['dist/', '.astro/', '.wrangler/', 'node_modules/']),

  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs['flat/recommended'],

  {
    // Pages and libraries run at build time (Node); scripts and islands run in the browser.
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      // Allow deliberately unused names when they start with an underscore.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // `try { localStorage… } catch {}` is how this site ignores blocked storage.
      'no-empty': ['error', { allowEmptyCatch: true }],
      // House style allows `cond && run()` and `a ? open() : close()` as statements.
      '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
    },
  },

  {
    // The classic Rules of Hooks. The React Compiler rules in react-hooks v7 (set-state-in-effect, refs, ...) are
    // left off: the site doesn't use the compiler, and the islands deliberately read browser-only state
    // (localStorage, URL, sessionStorage) in effects after hydration.
    files: ['**/*.tsx'],
    plugins: reactHooks.configs.flat.recommended.plugins,
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
);
