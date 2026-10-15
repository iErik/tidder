// The parts of Reddit's JSON the app reads. Reddit sends more fields than
// these, and some of them vary by post type, hence the loose typing of
// media and preview data.

export interface Thing<Kind extends string, Data> {
  kind: Kind
  data: Data
}

export interface Listing<T> {
  after: string | null
  before: string | null
  children: T[]
}

export interface ListingResponse<T> {
  kind: 'Listing'
  data: Listing<T>
}

export interface Post {
  id: string
  name: string
  title: string
  author: string
  subreddit: string
  subreddit_name_prefixed: string
  permalink: string
  url: string
  domain: string
  score: number
  num_comments: number
  created_utc: number
  likes: boolean | null
  saved: boolean
  reported?: boolean
  is_self: boolean
  is_video: boolean
  selftext_html: string | null
  thumbnail: string
  post_hint?: string
  media: any
  secure_media_embed: { content?: string }
  preview?: { images: { source: { url: string }; variants: Record<string, any> }[] }
}

export interface Comment {
  id: string
  name: string
  parent_id: string
  author: string
  score: number
  depth: number
  created_utc: number
  likes: boolean | null
  saved: boolean
  reported?: boolean
  body_html: string
  subreddit: string
  subreddit_name_prefixed: string
  // An empty string when there are no replies.
  replies: ListingResponse<CommentThing | MoreThing> | ''
}

export interface More {
  id: string
  name: string
  parent_id: string
  count: number
  children: string[]
}

export interface Subreddit {
  name: string
  title: string
  url: string
  display_name: string
  display_name_prefixed: string
  public_description: string
  subscribers: number
  created_utc: number
  icon_img: string
  subreddit_type: string
  user_is_subscriber: boolean
}

export interface Multireddit {
  name: string
  path: string
  display_name: string
}

export interface Identity {
  name: string
}

export interface SubredditRule {
  short_name: string
  violation_reason: string
}

export type PostThing = Thing<'t3', Post>
export type CommentThing = Thing<'t1', Comment>
export type MoreThing = Thing<'more', More>
export type SubredditThing = Thing<'t5', Subreddit>

// Anything that can be voted on, saved or reported.
export type Votable = Post | Comment
