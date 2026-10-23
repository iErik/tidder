import { compileString } from 'sass'
import { describe, expect, it } from 'vitest'

// Compiles a rule with px-to-rem() from _mixins.scss, next to
// this file, and returns the CSS and any warnings
function compile(value: string) {
  const warnings: string[] = []
  const source = '@use \'mixins\' as *;\n' +
    `.a { font-size: px-to-rem(${value}); }`

  const { css } = compileString(source, {
    url: new URL(import.meta.url),
    style: 'compressed',
    logger: { warn: (message) => { warnings.push(message) } }
  })

  return { css, warnings }
}

describe('px-to-rem()', () => {
  it('converts px to rem against a 16px root', () => {
    const { css, warnings } = compile('12px')

    expect(css).toBe('.a{font-size:.75rem}')
    expect(warnings).toEqual([])
  })

  it('keeps fractions', () => {
    const { css } = compile('10.5px')

    expect(css).toBe('.a{font-size:.65625rem}')
  })

  it('rejects a size that isn\'t in px', () => {
    const message = 'px-to-rem() expects a px length, got 1em'

    expect(() => compile('1em')).toThrow(message)
    expect(() => compile('12')).toThrow('got 12')
  })
})
