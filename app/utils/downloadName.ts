const MAX_TITLE_LENGTH = 80

// Characters Windows, macOS or Linux don't allow in a file
// name, and control characters
const ILLEGAL = /[\\/:*?"<>|\u0000-\u001f\u007f]/g

// The name a download of `url` is suggested under: the post's
// title, made safe for a file name and cut to about 80
// characters, plus the media's extension. Falls back to the
// URL's own file name when nothing is left of the title.
export function downloadName(title: string, url: string): string {
  const { pathname, searchParams } = new URL(url)
  const fileName = decodeURIComponent(pathname.split('/').pop() ?? '')

  const name = title
    .replace(ILLEGAL, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, MAX_TITLE_LENGTH)
    // Windows drops trailing dots and spaces
    .replace(/^[\s.]+|[\s.]+$/g, '')

  if (!name) return fileName || 'download'

  // Reddit serves a GIF's mp4 version at the GIF's own path
  const extension = searchParams.get('format') === 'mp4'
    ? 'mp4'
    : /\.([a-z0-9]+)$/i.exec(fileName)?.[1]

  return extension ? `${name}.${extension}` : name
}
