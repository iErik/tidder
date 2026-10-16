import {
  describe,
  expect,
  it
} from 'vitest'

import {
  isPrerelease,
  nextVersion
} from './next-version.mjs'

// The repo's tags as of the first automated release
const TAGS = ['v1.0.0-beta.1', 'v1.0.0-beta.2', 'v1.0.0-beta.3']

describe('nextVersion', () => {
  it('follows the highest tag on a pre-release line', () => {
    expect(nextVersion('1.0.0-beta', TAGS)).toBe('1.0.0-beta.4')
  })

  it('compares numbers, not strings', () => {
    const tags = ['v1.0.0-beta.9', 'v1.0.0-beta.10']
    expect(nextVersion('1.0.0-beta', tags)).toBe('1.0.0-beta.11')
  })

  it('ignores tag order and gaps', () => {
    const tags = ['v1.0.0-beta.7', 'v1.0.0-beta.2']
    expect(nextVersion('1.0.0-beta', tags)).toBe('1.0.0-beta.8')
  })

  it('starts a new pre-release line at 1', () => {
    expect(nextVersion('1.0.0-rc', TAGS)).toBe('1.0.0-rc.1')
  })

  it('starts a new stable line at 0', () => {
    expect(nextVersion('1.1', TAGS)).toBe('1.1.0')
  })

  it('follows the highest patch on a stable line', () => {
    const tags = [...TAGS, 'v1.1.0', 'v1.1.1', 'v1.10.4']
    expect(nextVersion('1.1', tags)).toBe('1.1.2')
  })

  it('ignores tags from other lines', () => {
    const tags = [
      'v1.0.0-beta1',
      'v1.0.0-beta.3.1',
      'v1.0.0-betaX.5',
      'v2.0.0-beta.6',
      '1.0.0-beta.7'
    ]

    expect(nextVersion('1.0.0-beta', tags)).toBe('1.0.0-beta.1')
  })

  it('rejects a full version as the line', () => {
    expect(() => nextVersion('1.0.0', TAGS)).toThrow(/release line/)
    expect(() => nextVersion('1.0.0-beta.2', TAGS))
      .toThrow(/release line/)
  })
})

describe('isPrerelease', () => {
  it('is true only with a pre-release part', () => {
    expect(isPrerelease('1.0.0-beta.4')).toBe(true)
    expect(isPrerelease('1.1.0')).toBe(false)
  })
})
