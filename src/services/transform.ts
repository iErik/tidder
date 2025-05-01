
const pick = (obj, keys = []) => {
  const final = {}

  for (let key in obj)
    if (key in keys) final[key] = obj[key]

  return final
}


type Post = {
  subreddit: string,
  title:     string,
  id:        string,
  author:    string

  quarantined: boolean,
  hideScore:  boolean,
  isGallery:  boolean,
  archived:   boolean,
  clicked:    boolean,
  spoiler:    boolean,
  visited:    boolean,
  isVideo:    boolean,
  locked:     boolean,
  hidden:     boolean,
  canMod:     boolean,
  edited:     boolean,
  sticky:     boolean,
  pinned:     boolean,
  saved:      boolean,
  nsfw:       boolean,

  createdAt: number,

  comments: number,
  ratio:    number,
  ups:      number,
  downs:    number,
  score:    number,
  views:    number,
}

type Listing = {
  after: string,
  dist:  number,
  items: [Post]
}


export const post = ({ data }): Post => {
  const p = pick(data, [
    'subreddit',
    'title',
    'id',
    'author',
    'archived',
    'clicked',
    'spoiler',
    'visited',
    'locked',
    'hidden',
    'pinned',
    'edited',
    'saved',
    'created',
    'ups',
    'downs',
    'score'
  ])

  return {
    ...p,
    quarantined: data.quarantine,
    createdAt:   data.created,
    isGallery:   data.is_gallery,
    hideScore:   data.hide_score,
    comments:    data.num_comments,
    isVideo:     data.is_video,
    sticky:      data.stickied,
    ratio:       data.upvote_ratio,
  }
}

export const listing = ({ data }): Listing => ({
  after: data.after,
  dist: data.dist,
  posts: (data.children || []).map(post)
})
