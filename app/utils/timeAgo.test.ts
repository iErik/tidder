import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import { timeAgo } from './timeAgo'

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const NOW = new Date('2026-01-01T12:00:00Z').getTime()

describe('timeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // Each threshold, as moment's fromNow() words it
  it.each([
    [0, 'a few seconds'],
    [44 * SECOND, 'a few seconds'],
    [45 * SECOND, 'a minute'],
    [89 * SECOND, 'a minute'],
    [90 * SECOND, '2 minutes'],
    [44 * MINUTE, '44 minutes'],
    [45 * MINUTE, 'an hour'],
    [90 * MINUTE, '2 hours'],
    [21 * HOUR, '21 hours'],
    [22 * HOUR, 'a day'],
    [36 * HOUR, '2 days'],
    [25 * DAY, '25 days'],
    [26 * DAY, 'a month'],
    [45 * DAY, '2 months'],
    [300 * DAY, '10 months'],
    [320 * DAY, 'a year'],
    [548 * DAY, '2 years'],
    [3650 * DAY, '10 years']
  ])('words %i ms ago as "%s ago"', (elapsed, text) => {
    expect(timeAgo(NOW - elapsed)).toBe(`${text} ago`)
  })

  it('leaves out the suffix when asked', () => {
    expect(timeAgo(NOW - 3 * HOUR, true)).toBe('3 hours')
  })

  it('measures future times the same way', () => {
    expect(timeAgo(NOW + 3 * HOUR, true)).toBe('3 hours')
  })
})
