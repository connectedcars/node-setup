const js = require('@eslint/js')
const tsEslint = require('typescript-eslint')
const eslintPluginJest = require('eslint-plugin-jest')
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended')
const eslintPluginSimpleImportSort = require('eslint-plugin-simple-import-sort')
const globals = require('globals')

module.exports = [
  {
    ignores: ['**/*.d.ts']
  },
  js.configs.recommended,
  ...tsEslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  eslintPluginJest.configs['flat/recommended'],
  {
    plugins: {
      'simple-import-sort': eslintPluginSimpleImportSort
    },
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node
      },
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      parserOptions: {
        // https://typescript-eslint.io/blog/parser-options-project-true/
        project: true
      }
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      '@typescript-eslint/explicit-member-accessibility': 'error',
      'func-style': ['error', 'declaration'],
      'jest/consistent-test-it': ['warn', { fn: 'it', withinDescribe: 'it' }],
      '@typescript-eslint/member-ordering': 'error',
      'no-console': 'error',
      // note you must disable the base rule as it can report incorrect errors
      'no-dupe-class-members': 'off',
      '@typescript-eslint/no-dupe-class-members': ['error'],
      'no-restricted-imports': ['error', { patterns: ['@connectedcars/*/build/dist/*'] }],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message: "'export default' is not allowed"
        },
        {
          // Incorrect: 'str'.replace('pattern', 'replacement')
          // Correct:   'str'.replace(/pattern/, 'replacement')
          // Correct:   'str'.replaceAll('pattern', 'replacement')
          selector:
            "CallExpression[callee.property.name='replace'][arguments.0.type='Literal']:not([arguments.0.regex])",
          message:
            'Using String.replace with a string argument is error-prone because it only replaces the first occurrence of the pattern. Use String.replaceAll or a RegExp pattern instead.'
        },
        {
          // Incorrect: knex().onConflict().ignore()
          // Correct:   knex().onConflict().merge(['unchangedColumn'])
          selector: "CallExpression[callee.property.name='ignore'][callee.object.callee.property.name='onConflict']",
          message:
            "Using '.ignore()' is disallowed as it will ignore all errors in MySQL (as it will generate a query using 'insert ignore'). Use '.merge()' to create a noop instead."
        },
        // Incorrect: [3, 2, 1].sort()
        // Incorrect: array1.sort()
        // Correct:   [3, 2, 1].toSorted()
        // Correct:   array1.toSorted()
        {
          selector: "CallExpression[callee.property.name='sort']",
          message: 'Using Array.sort() is error-prone because it sorts in place. Use Array.toSorted() instead.'
        },
        // Incorrect: [3, 2, 1].reverse()
        // Incorrect: array1.reverse()
        // Correct:   [3, 2, 1].toReversed()
        // Correct:   array1.toReversed()
        {
          selector: "CallExpression[callee.property.name='reverse']",
          message: 'Using Array.reverse() is error-prone because it reverses in place. Use Array.toReversed() instead.'
        }
      ],
      'object-shorthand': 'warn',
      '@typescript-eslint/parameter-properties': 'error',
      'prettier/prettier': [
        'error',
        {
          printWidth: 120,
          singleQuote: true,
          semi: false,
          trailingComma: 'none',
          arrowParens: 'avoid'
        }
      ],
      '@typescript-eslint/require-await': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error'
    }
  },
  {
    files: ['**/*.test.ts', '**/*.it.ts', 'bin/*.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off'
    }
  },
  {
    files: ['**/*.js'],
    ...tsEslint.configs.disableTypeChecked,
    rules: {
      ...tsEslint.configs.disableTypeChecked.rules,
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off'
    }
  }
]
