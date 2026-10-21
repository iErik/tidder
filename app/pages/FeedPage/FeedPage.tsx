import { useEffect, useState } from 'react'
import { matchPath, useLocation } from 'react-router'

import type { Post, Votable } from 'api/types'

import Icon from 'components/Icon/Icon'
import PostFeed from 'components/PostFeed/PostFeed'
import PostSubmit from 'components/PostSubmit/PostSubmit'
import PostViewer from 'components/PostViewer/PostViewer'
import ReportCard from 'components/ReportCard/ReportCard'
import SharePostCard from 'components/SharePostCard/SharePostCard'

import { FeedProvider, useFeedState } from './FeedContext'

// What the feed and the post viewer ask the page to do.
export type FeedAction =
  | { type: 'open'; thing: Post }
  | { type: 'submit' }
  | { type: 'report'; thing: Votable }
  | { type: 'share'; thing: Post }

type Overlay = Exclude<FeedAction, { type: 'open' }>

// Maps the route to the feed source, and whether the search
// query is cleared on the way there.
function sourceForPath(pathname: string): {
  source: string
  resetQuery: boolean
} {
  const subreddit = matchPath('/r/:subredditName', pathname)
  const multi = matchPath(
    '/user/:userName/m/:multiName',
    pathname
  )

  if (subreddit)
    return {
      source: `r/${subreddit.params.subredditName}`,
      resetQuery: false
    }
  if (multi)
    return {
      source: `/user/${multi.params.userName}/m/${multi.params.multiName}/`,
      resetQuery: true
    }
  if (matchPath('/saved', pathname))
    return { source: 'saved', resetQuery: true }

  return { source: 'home', resetQuery: true }
}

// Every route shows this page, and it stays mounted between
// them, so the open post and the sort mode survive
// navigating to another feed.
export default function FeedPage() {
  return (
    <FeedProvider>
      <FeedPageContents />
    </FeedProvider>
  )
}

function FeedPageContents() {
  const { pathname } = useLocation()
  const { setSource } = useFeedState()

  const [currentPost, setCurrentPost] = useState<Post | null>(null)
  const [overlay, setOverlay] = useState<Overlay | null>(null)

  useEffect(() => {
    const { source, resetQuery } = sourceForPath(pathname)
    setSource(source, resetQuery)
  }, [pathname, setSource])

  // The page behind an overlay shouldn't scroll.
  useEffect(() => {
    if (!overlay) return

    document.body.classList.add('no-scroll')
    return () => document.body.classList.remove('no-scroll')
  }, [overlay])

  const handleFeedAction = (action: FeedAction) => {
    if (action.type === 'open')
      setCurrentPost(action.thing)
    else
      setOverlay(action)
  }

  const closeOverlay = () => setOverlay(null)

  return (
    <div className="page">
      <div className="collapse inner container align-start">
        {overlay && (
          <div className="overlay-container">
            <button
              type="button"
              aria-label="Close"
              className="btn-close"
              onClick={closeOverlay}
            >
              <Icon name="close" />
            </button>

            <div className="overlay-contents">
              {
                overlay.type === 'submit' &&
                <PostSubmit onCancel={closeOverlay} />
              }
              {
                overlay.type === 'report' &&
                <ReportCard
                  thing={overlay.thing}
                  onCancel={closeOverlay}
                />
              }
              {
                overlay.type === 'share' &&
                <SharePostCard post={overlay.thing} />
              }
            </div>
          </div>
        )}

        <div className="flex-column small-5 columns">
          <PostFeed onFeedAction={handleFeedAction} />
        </div>

        <div className="small-7 columns">
          {currentPost &&
            <PostViewer
              key={currentPost.name}
              currentPost={currentPost}
              onFeedAction={handleFeedAction}
            />}
        </div>
      </div>
    </div>
  )
}
