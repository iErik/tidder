const REDDIT = 'https://www.reddit.com'

// The absolute URL a link points to, with Reddit's pages and
// Tidder's own routes on reddit.com. `href` is either a link's
// raw href or the absolute URL Electron resolved it to, against
// the app's page at `page`:
//
// - another site (https://…, mailto:…) stays as it is
// - a protocol-relative link (//example.com) is on https, not
//   on the app page's file: or http:
// - an in-app route (#/r/pics) is the matching reddit.com page
// - a path (/r/pics), which Reddit's HTML uses for its own
//   pages, is resolved against reddit.com
// - the app's page without a route (href="#" or "") isn't a
//   link to anywhere, and gives null, as does an invalid URL
export function redditUrl(
  href: string,
  page: string = window.location.href
): string | null {
  try {
    const app = new URL(page)
    const url = new URL(
      href.startsWith('//') ? `https:${href}` : href,
      app
    )

    // Electron resolves //example.com against the packaged
    // app's page as file://example.com
    if (url.protocol === 'file:' && url.host)
      url.protocol = 'https:'

    // file: URLs all have a 'null' origin
    if (url.protocol !== app.protocol || url.host !== app.host)
      return url.href

    if (url.pathname === app.pathname) {
      if (!url.hash.startsWith('#/')) return null
      return REDDIT + url.hash.slice(1)
    }

    // A relative path (r/pics) resolves under the page's
    // directory, and on Windows a root path (/r/pics) under
    // its drive (file:///C:/r/pics). Neither is part of the
    // Reddit path.
    const dir = app.pathname.replace(/[^/]*$/, '')
    const root = /^\/[A-Za-z]:\//.exec(app.pathname)?.[0] ?? '/'
    const prefix = url.pathname.startsWith(dir) ? dir : root
    const path = url.pathname.startsWith(prefix)
      ? url.pathname.slice(prefix.length - 1)
      : url.pathname

    return REDDIT + path + url.search + url.hash
  } catch {
    return null
  }
}
