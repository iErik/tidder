import { describe, expect, it } from 'vitest'

import { redditUrl } from './redditUrl'

// The packaged app's page, and the dev server's
const packaged = 'file:///opt/Tidder/dist/renderer/browser/index.html'
const dev = 'http://localhost:4200/'
const windows = 'file:///C:/Program%20Files/Tidder/resources/' +
  'app.asar/dist/renderer/browser/index.html'

describe('redditUrl', () => {
  // Root paths there resolve under the drive: file:///C:/r/pics
  it('resolves Reddit paths on a Windows page', () => {
    expect(redditUrl('/r/pics', windows))
      .toBe('https://www.reddit.com/r/pics')
    expect(redditUrl('file:///C:/r/pics?a=1', windows))
      .toBe('https://www.reddit.com/r/pics?a=1')
    expect(redditUrl('r/pics', windows))
      .toBe('https://www.reddit.com/r/pics')
    expect(redditUrl('#/r/pics', windows))
      .toBe('https://www.reddit.com/r/pics')
    expect(redditUrl('//example.com/a', windows))
      .toBe('https://example.com/a')
  })

  it('keeps a link to another site as it is', () => {
    expect(redditUrl('https://example.com/a?b=1#c', packaged))
      .toBe('https://example.com/a?b=1#c')
    expect(redditUrl('https://www.reddit.com/r/pics', dev))
      .toBe('https://www.reddit.com/r/pics')
  })

  it('keeps other schemes', () => {
    expect(redditUrl('mailto:someone@example.com', packaged))
      .toBe('mailto:someone@example.com')
  })

  it('puts a protocol-relative link on https', () => {
    expect(redditUrl('//example.com/a?b=1', packaged))
      .toBe('https://example.com/a?b=1')
    expect(redditUrl('//example.com/a', dev))
      .toBe('https://example.com/a')
  })

  // What Electron reports for //example.com/a in the
  // packaged app
  it('puts a file: URL with a host on https', () => {
    expect(redditUrl('file://example.com/a', packaged))
      .toBe('https://example.com/a')
  })

  it('resolves a Reddit path against reddit.com', () => {
    expect(redditUrl('/r/pics/comments/abc/?sort=new', packaged))
      .toBe('https://www.reddit.com/r/pics/comments/abc/?sort=new')
    expect(redditUrl('/u/someone', dev))
      .toBe('https://www.reddit.com/u/someone')
  })

  it('resolves a relative path against reddit.com', () => {
    expect(redditUrl('r/pics', packaged))
      .toBe('https://www.reddit.com/r/pics')
    expect(redditUrl('r/pics', dev))
      .toBe('https://www.reddit.com/r/pics')
  })

  // What Electron reports for a Reddit path in the page
  it('maps a path Electron resolved against the app', () => {
    expect(redditUrl('file:///r/pics', packaged))
      .toBe('https://www.reddit.com/r/pics')
    expect(redditUrl('http://localhost:4200/u/someone', dev))
      .toBe('https://www.reddit.com/u/someone')
  })

  it('maps an in-app route to its reddit.com page', () => {
    expect(redditUrl('#/r/pics/', packaged))
      .toBe('https://www.reddit.com/r/pics/')
    expect(redditUrl('#/user/someone/m/stuff/', dev))
      .toBe('https://www.reddit.com/user/someone/m/stuff/')
  })

  // What Electron reports for a router link
  it('maps a route Electron resolved against the app', () => {
    expect(redditUrl(`${packaged}#/r/pics`, packaged))
      .toBe('https://www.reddit.com/r/pics')
    expect(redditUrl(`${dev}#/saved`, dev))
      .toBe('https://www.reddit.com/saved')
    expect(redditUrl(`${dev}#/`, dev))
      .toBe('https://www.reddit.com/')
  })

  it('gives null for the app\'s page without a route', () => {
    expect(redditUrl('#', packaged)).toBeNull()
    expect(redditUrl('', packaged)).toBeNull()
    expect(redditUrl(`${packaged}#`, packaged)).toBeNull()
    expect(redditUrl(dev, dev)).toBeNull()
  })

  it('gives null for an invalid URL', () => {
    expect(redditUrl('http://', dev)).toBeNull()
  })

  it('resolves against the current page by default', () => {
    expect(redditUrl('#/r/pics'))
      .toBe('https://www.reddit.com/r/pics')
  })
})
