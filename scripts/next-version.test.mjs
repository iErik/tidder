import {
  describe,
  expect,
  it
} from 'vitest'

import {
  isPrerelease,
  nextVersion,
  setVersion,
  shouldBump
} from './next-version.mjs'

// The repo's tags as of the first automated release
const TAGS = ['v1.0.0-beta.1', 'v1.0.0-beta.2', 'v1.0.0-beta.3']

describe('nextVersion', () => {
  it('follows the highest tag on a pre-release line', () => {
    expect(nextVersion('1.0.0-beta.3', TAGS)).toBe('1.0.0-beta.4')
  })

  it('follows the highest tag past package.json', () => {
    expect(nextVersion('1.0.0-beta.1', TAGS)).toBe('1.0.0-beta.4')
  })

  it('releases a version whose bump never landed', () => {
    const tags = [...TAGS, 'v1.0.0-beta.4']
    expect(nextVersion('1.0.0-beta.4', tags)).toBe('1.0.0-beta.5')
    expect(nextVersion('1.0.0-beta.4', TAGS)).toBe('1.0.0-beta.4')
  })

  it('compares numbers, not strings', () => {
    const tags = ['v1.0.0-beta.9', 'v1.0.0-beta.10']
    expect(nextVersion('1.0.0-beta.9', tags)).toBe('1.0.0-beta.11')
  })

  it('ignores tag order and gaps', () => {
    const tags = ['v1.0.0-beta.7', 'v1.0.0-beta.2']
    expect(nextVersion('1.0.0-beta.2', tags)).toBe('1.0.0-beta.8')
  })

  it('releases the first version of a new line as is', () => {
    expect(nextVersion('1.0.0-rc.1', TAGS)).toBe('1.0.0-rc.1')
    expect(nextVersion('1.1.0', TAGS)).toBe('1.1.0')
  })

  it('follows the highest patch on a stable line', () => {
    const tags = [...TAGS, 'v1.1.0', 'v1.1.1', 'v1.10.4']
    expect(nextVersion('1.1.0', tags)).toBe('1.1.2')
  })

  it('ignores tags from other lines', () => {
    const tags = [
      'v1.0.0-beta1',
      'v1.0.0-beta.3.1',
      'v1.0.0-betaX.5',
      'v2.0.0-beta.6',
      '1.0.0-beta.7'
    ]

    expect(nextVersion('1.0.0-beta.1', tags)).toBe('1.0.0-beta.1')
  })

  it('rejects anything but a full release version', () => {
    for (const version of ['1.0.0-beta', '1.1', '1.0.0-beta.2.1'])
      expect(() => nextVersion(version, TAGS))
        .toThrow(/release version/)
  })
})

describe('shouldBump', () => {
  it('moves forward on the same line', () => {
    expect(shouldBump('1.0.0-beta.3', '1.0.0-beta.4')).toBe(true)
    expect(shouldBump('1.1.0', '1.1.2')).toBe(true)
  })

  it('never moves back or stays put', () => {
    expect(shouldBump('1.0.0-beta.4', '1.0.0-beta.4')).toBe(false)
    expect(shouldBump('1.0.0-beta.5', '1.0.0-beta.4')).toBe(false)
  })

  it('leaves a line changed by hand alone', () => {
    expect(shouldBump('1.1.0', '1.0.0-beta.4')).toBe(false)
    expect(shouldBump('1.0.0-rc.1', '1.0.0-beta.4')).toBe(false)
  })
})

describe('setVersion', () => {
  const pkg = [
    '{',
    '  "name": "tidder",',
    '  "version": "1.0.0-beta.3",',
    '  "build": {',
    '    "version": "untouched"',
    '  }',
    '}',
    ''
  ].join('\n')

  it('replaces only the top-level version', () => {
    expect(setVersion(pkg, '1.0.0-beta.4'))
      .toBe(pkg.replace('1.0.0-beta.3', '1.0.0-beta.4'))
  })

  it('needs exactly one top-level version', () => {
    expect(() => setVersion('{\n}\n', '1.0.0-beta.4'))
      .toThrow(/found 0/)

    const twice = pkg.replace('{', '{\n  "version": "1.0.0",')
    expect(() => setVersion(twice, '1.0.0-beta.4'))
      .toThrow(/found 2/)
  })
})

describe('isPrerelease', () => {
  it('is true only with a pre-release part', () => {
    expect(isPrerelease('1.0.0-beta.4')).toBe(true)
    expect(isPrerelease('1.1.0')).toBe(false)
  })
})
