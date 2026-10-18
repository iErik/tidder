import {
  describe,
  expect,
  it
} from 'vitest'

import { downloadName } from './downloadName'

const IMAGE = 'https://i.redd.it/abc123.jpg'

describe('downloadName', () => {
  it('names the file after the title, with the extension', () => {
    expect(downloadName('A cat', IMAGE)).toBe('A cat.jpg')
  })

  it('ignores the query when finding the extension', () => {
    const preview = 'https://preview.redd.it/abc.png?width=640&s=x'

    expect(downloadName('A cat', preview)).toBe('A cat.png')
  })

  it('uses mp4 for a GIF served as video', () => {
    const mp4 = 'https://preview.redd.it/abc.gif?format=mp4&s=x'

    expect(downloadName('A cat', mp4)).toBe('A cat.mp4')
  })

  it('removes characters file names can\'t have', () => {
    expect(downloadName('What? A <cat>: yes/no*|"', IMAGE))
      .toBe('What A cat yes no.jpg')
  })

  it('removes control characters and extra spaces', () => {
    expect(downloadName('  A\u0000\tcat\n ', IMAGE)).toBe('A cat.jpg')
  })

  it('drops trailing dots', () => {
    expect(downloadName('Wait for it...', IMAGE))
      .toBe('Wait for it.jpg')
  })

  it('cuts a long title to 80 characters', () => {
    const name = downloadName('a'.repeat(200), IMAGE)

    expect(name).toBe(`${'a'.repeat(80)}.jpg`)
  })

  it('falls back to the URL\'s file name', () => {
    expect(downloadName('???', IMAGE)).toBe('abc123.jpg')
  })

  it('leaves the extension out when the URL has none', () => {
    expect(downloadName('A clip', 'https://v.redd.it/abc/DASH'))
      .toBe('A clip')
  })
})
