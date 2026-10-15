// Splits single-line imports longer than `max` characters
// into one imported name per line. Imports without named
// imports can't get shorter, so they're left alone.

export default {
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: [{
      type: 'object',
      properties: { max: { type: 'integer', minimum: 1 } },
      additionalProperties: false
    }],
    messages: {
      tooLong: 'This import is {{length}} characters long.'
        + ' Put each imported name on its own line.'
    }
  },

  create(context) {
    const { max = 60 } = context.options[0] ?? { }
    const source = context.sourceCode

    return {
      ImportDeclaration(node) {
        const named = node.specifiers.filter(
          spec => spec.type === 'ImportSpecifier')
        if (named.length === 0) return

        const { start, end } = node.loc
        if (start.line !== end.line) return

        const length = source.lines[start.line - 1].length
        if (length <= max) return

        const open = source.getTokenBefore(named[0])
        const close = source.getTokenAfter(named.at(-1),
          token => token.value === '}')

        context.report({
          node,
          messageId: 'tooLong',
          data: { length },
          fix: fixer => fixer.replaceTextRange(
            [open.range[0], close.range[1]],
            '{\n'
              + named.map(spec => '  ' + source.getText(spec))
                .join(',\n')
              + '\n}')
        })
      }
    }
  }
}
