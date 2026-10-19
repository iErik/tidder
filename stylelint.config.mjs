// Stylelint. Every enabled rule is an error. No shareable
// preset: the named list is the whole style guide.

/** @type {import('stylelint').Config} */
export default {
  customSyntax: 'postcss-scss',
  plugins: [
    'stylelint-scss',
    '@stylistic/stylelint-plugin'
  ],
  ignoreFiles: [
    'app/styles/vendors/**',
    'app/styles/helpers/_themes.generated.scss'
  ],
  reportDescriptionlessDisables: true,
  reportUnscopedDisables: true,
  reportInvalidScopeDisables: true,
  reportNeedlessDisables: true,
  rules: {
    '@stylistic/indentation': 2,
    '@stylistic/string-quotes': ['single', {
      avoidEscape: true
    }],
    '@stylistic/declaration-block-trailing-semicolon':
      'always',
    'block-no-empty': true,
    'declaration-block-no-duplicate-properties': true,
    'property-no-unknown': true,
    'unit-no-unknown': true,
    'color-no-invalid-hex': true,
    'scss/at-rule-no-unknown': true
  }
}
