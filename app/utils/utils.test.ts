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

  describe('with negative numbers', () => {
    it.each([
      [-999, '-999'],
      [-1000, '-1K'],
      [-1500, '-1.5K'],
      [-2500000, '-2.5M'],
      [-3e9, '-3B'],
      [-4.5e12, '-4.5T']
    ])('abbreviates %i as %s', (num, expected) => {
      expect(abbreviate(num)).toBe(expected)
    })

    it('accepts numeric strings', () => {
      expect(abbreviate('-2500')).toBe('-2.5K')
    })

    it('rounds to at most maxPlaces decimals', () => {
      expect(abbreviate(-1234, 1)).toBe('-1.2K')
      expect(abbreviate(-1200, 1)).toBe('-1.2K')
    })

    it('pads to forcePlaces decimals from a thousand up', () => {
      expect(abbreviate(-2000, false, 1)).toBe('-2.0K')
      expect(abbreviate(-500, false, 2)).toBe('-500')
    })

    it('keeps the sign with forceLetter', () => {
      expect(abbreviate(-1500000, false, false, 'K'))
        .toBe('-1500K')
    })

    it.each([
      [1500, '1.5K'],
      [-1500, '-1.5K'],
      [-1000, '-1.0K'],
      [-2000000, '-2.0M'],
      [-999, '-999'],
      [0, '0']
    ])('formats the score %i as %s', (num, expected) => {
      expect(abbreviate(num, 1, 1)).toBe(expected)
    })
  })

  describe('when rounding reaches 1000 of a unit', () => {
    it.each([
      [999950, 1, 1, '1.0M'],
      [999950, 1, false, '1M'],
      [999999999, 1, 1, '1.0B'],
      [999.96, 1, false, '1K'],
      [999.96, 1, 1, '1.0K'],
      [-999950, 1, 1, '-1.0M']
    ] as const)(
      'moves %d (%s, %s) up to %s',
      (num, maxPlaces, forcePlaces, expected) => {
        expect(abbreviate(num, maxPlaces, forcePlaces))
          .toBe(expected)
      }
    )

    it('stays in the unit when rounding stays below', () => {
      expect(abbreviate(999949, 1, 1)).toBe('999.9K')
    })

    it('does not round without maxPlaces', () => {
      expect(abbreviate(999950)).toBe('999.95K')
    })

    it('never moves past T', () => {
      expect(abbreviate(999950000000000, 1, 1))
        .toBe('1000.0T')
    })

    it('never moves a forced unit', () => {
      expect(abbreviate(999950, 1, 1, 'K')).toBe('1000.0K')
    })
  })
})
