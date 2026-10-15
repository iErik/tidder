// Runs before every renderer test file

import { cleanup } from '@testing-library/react'

import {
  afterEach,
  beforeEach
} from 'vitest'

import { installFakeTidder } from './fakeTidder'

// Test files import the app's modules before any test runs
installFakeTidder()

beforeEach(() => {
  installFakeTidder()
  localStorage.clear()
})

// Testing Library only unmounts by itself with globals on
afterEach(() => {
  cleanup()
})
