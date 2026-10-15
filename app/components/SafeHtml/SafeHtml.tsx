import { useMemo, type MouseEvent } from 'react'
import DOMPurify from 'dompurify'

// Reddit's HTML for posts, comments and subreddit descriptions. Requests
// use raw_json=1, so it arrives as real HTML (no entity decoding needed),
// and it's sanitized before being shown.

// Embedded media (YouTube and similar players) only load over https.
DOMPurify.addHook('uponSanitizeElement', (node, data) => {
  if (data.tagName === 'iframe' && !(node as Element).getAttribute('src')?.startsWith('https://'))
    node.parentNode?.removeChild(node)
})

const EMBED_CONFIG = {
  ADD_TAGS: ['iframe'],
  ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
}

// Links open in the system browser. Reddit writes links to its own pages
// as paths (/r/..., /u/...), which are resolved against reddit.com.
function openLink(ev: MouseEvent<HTMLElement>): void {
  const link = (ev.target as Element).closest('a')
  const href = link?.getAttribute('href')

  if (!link || !href) return

  ev.preventDefault()
  ev.stopPropagation()

  try {
    window.tidder.openExternal(new URL(href, 'https://www.reddit.com').href)
  } catch {
    // Not a usable URL; ignore the click.
  }
}

interface Props {
  html: string | null | undefined
  className?: string

  // Allows https iframes, for media embeds.
  embed?: boolean
}

export default function SafeHtml({ html, className, embed = false }: Props) {
  const clean = useMemo(
    () => DOMPurify.sanitize(html ?? '', embed ? EMBED_CONFIG : { }),
    [html, embed])

  return (
    <div
      className={className}
      onClick={openLink}
      dangerouslySetInnerHTML={{ __html: clean }} />
  )
}
