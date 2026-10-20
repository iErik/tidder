import { useMemo, type MouseEvent } from 'react'
import DOMPurify from 'dompurify'

import { redditUrl } from 'utils/redditUrl'

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

// Links open in the system browser, at the address redditUrl
// gives: Reddit writes links to its own pages as paths
// (/r/..., /u/...), which are resolved against reddit.com.
function openLink(ev: MouseEvent<HTMLElement>): void {
  const link = (ev.target as Element).closest('a')
  const href = link?.getAttribute('href')

  if (!link || !href) return

  ev.preventDefault()
  ev.stopPropagation()

  // Not a usable URL: the click is ignored
  const url = redditUrl(href)
  if (url) window.tidder.openExternal(url)
}

interface Props {
  html: string | null | undefined
  className?: string

  // Allows https iframes, for media embeds.
  embed?: boolean

  onContextMenu?: (ev: MouseEvent) => void
}

export default function SafeHtml({
  html,
  className,
  embed = false,
  onContextMenu
}: Props) {
  const clean = useMemo(
    () => DOMPurify.sanitize(html ?? '', embed ? EMBED_CONFIG : { }),
    [html, embed])

  return (
    <div
      className={className}
      onClick={openLink}
      onContextMenu={onContextMenu}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
