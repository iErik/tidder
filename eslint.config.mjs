// ESLint flat config. Every enabled rule is an error: the
// plugins' presets that use 'warn' are raised to 'error'.

import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

import importLength from './eslint-rules/import-length.mjs'

// Raises every 'warn' rule in a config object to 'error'
function errorsOnly(config) {
  const raise = ([name, value]) => {
    const level = Array.isArray(value) ? value[0] : value
    if (level !== 'warn' && level !== 1) return [name, value]

    return [name, Array.isArray(value)
      ? ['error', ...value.slice(1)]
      : 'error']
  }

  const rules = Object.entries(config.rules ?? { })
  return {
    ...config,
    rules: Object.fromEntries(rules.map(raise))
  }
}

// exp-list-style checks these lists too, but it's only
// wanted for function parameters and imports
const unlisted = [
  'ArrayExpression',
  'ArrayPattern',
  'CallExpression',
  'ExportNamedDeclaration',
  'IfStatement',
  'ImportAttributes',
  'JSONArrayExpression',
  'JSONObjectExpression',
  'NewExpression',
  'ObjectExpression',
  'ObjectPattern',
  'TSEnumBody',
  'TSInterfaceBody',
  'TSTupleType',
  'TSTypeLiteral',
  'TSTypeParameterDeclaration',
  'TSTypeParameterInstantiation'
]

const node = {
  globals: globals.node,
  ecmaVersion: 'latest'
}

export default defineConfig(
  {
    ignores: [
      'dist/',
      'release/',
      'coverage/',
      'node_modules/'
    ]
  },

  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error'
    }
  },

  // Formatting, for every linted file
  {
    files: ['**/*.{ts,tsx,mts,js,mjs,cjs}'],
    plugins: {
      '@stylistic': stylistic,
      local: { rules: { 'import-length': importLength } }
    },
    rules: {
      '@stylistic/semi': ['error', 'never'],
      // The same for interface and type literal members
      '@stylistic/member-delimiter-style': ['error', {
        multiline: { delimiter: 'none' },
        singleline: {
          delimiter: 'semi',
          requireLast: false
        }
      }],
      '@stylistic/quotes': ['error', 'single', {
        avoidEscape: true
      }],
      '@stylistic/indent': ['error', 2],
      // Parameters and imported names either share their
      // line, or each one gets a line of its own
      '@stylistic/exp-list-style': ['error', {
        overrides: Object.fromEntries(
          unlisted.map(type => [type, 'off']))
      }],
      // Its fixes would otherwise leave a space after commas
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/max-len': ['error', {
        code: 80,
        ignoreUrls: true
      }],
      // Imports have no reason to go past the 60 target
      'local/import-length': ['error', { max: 60 }],
      // Once a tag's attributes wrap, each one gets its own
      // line, the first included, and the tag closes on a
      // line of its own, aligned with its opening
      '@stylistic/jsx-max-props-per-line': ['error', {
        maximum: 1,
        when: 'multiline'
      }],
      '@stylistic/jsx-first-prop-new-line': [
        'error',
        'multiline'
      ],
      '@stylistic/jsx-closing-bracket-location': [
        'error',
        'tag-aligned'
      ]
    }
  },

  // Renderer
  ...tseslint.configs.recommendedTypeChecked.map(config => ({
    ...config,
    files: ['app/**/*.{ts,tsx}']
  })),
  {
    files: ['app/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      // React ignores what event handlers return, and a
      // handler's promise is the handler's own business
      '@typescript-eslint/no-misused-promises': ['error', {
        checksVoidReturn: { attributes: false }
      }]
    }
  },
  errorsOnly({
    ...reactHooks.configs.flat.recommended,
    files: ['app/**/*.{ts,tsx}']
  }),

  // Root TS config files: formatting only
  {
    files: ['*.mts'],
    languageOptions: { parser: tseslint.parser }
  },

  // Main process
  {
    ...js.configs.recommended,
    files: ['electron/**/*.js'],
    languageOptions: { ...node, sourceType: 'commonjs' }
  },

  // Main-process tests and their fakes are ES modules, since
  // Vitest can't be required
  {
    files: [
      'electron/**/*.test.js',
      'electron/test/**/*.js'
    ],
    languageOptions: { sourceType: 'module' }
  },

  // Build scripts, local rules and this file
  {
    ...js.configs.recommended,
    files: [
      'scripts/**/*.mjs',
      'eslint-rules/**/*.mjs',
      'eslint.config.mjs'
    ],
    languageOptions: { ...node, sourceType: 'module' }
  }
)
