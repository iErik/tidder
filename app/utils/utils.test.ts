import {
  describe,
  expect,
  it
} from 'vitest'

import {
  abbreviate,
  numToBoolean
} from './utils'

describe('numToBoolean', () => {
  it.each([
    [1, true],
    [5, true],
    [0, false],
    [-1, false]
  ])('turns %i into %s', (num, expected) => {
    expect(numToBoolean(num)).toBe(expected)
  })
})

describe('abbreviate', () => {
  it.each([
    [999, '999'],
    [1000, '1K'],
    [1500, '1.5K'],
    [2500000, '2.5M'],
    [3e9, '3B'],
    [4.5e12, '4.5T']
  ])('abbreviates %i as %s', (num, expected) => {
    expect(abbreviate(num)).toBe(expected)
  })

  it('accepts numeric strings', () => {
    expect(abbreviate('2500')).toBe('2.5K')
  })

  it('rounds to at most maxPlaces decimals', () => {
    expect(abbreviate(1234, 1)).toBe('1.2K')
    expect(abbreviate(1200, 1)).toBe('1.2K')
  })

  it('pads to forcePlaces decimals from a thousand up', () => {
    expect(abbreviate(2000, false, 1)).toBe('2.0K')
    expect(abbreviate(500, false, 2)).toBe('500')
  })

  it('uses forceLetter instead of the natural unit', () => {
    expect(abbreviate(1500000, false, false, 'K'))
      .toBe('1500K')
  })
})
