import { Listing } from '@devvit/public-api'
//mport { Listing } from '@devvit/protos'

//import * as transform from '@services/transform'

// Perhaps use an ENV variable here
const BASE_URL = 'https://www.reddit.com'
const AUTH_URL = 'https://oauth.reddit.com'

const CLIENT_ID = 'SQQZtXuPBE9H8A'

const genUUID = (length: number) => {
  let str = ''

  while (str.length < length)
    str += Math.random().toString(36).substr(2)

  return str.substr(0, length)
}

export const get = async (endpoint = '') => {
  //await authorize()

  /*
  const rootUrl = false ? AUTH_URL : BASE_URL
  const url = `${rootUrl}/${endpoint}/.json`

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
      // ...stuff goes here
    })

    console.log({ res })

    if (!res.ok)
      throw new Error(`Reponse status: ${res.status}`)

    const data = await res.json()
    console.log({ data })

  } catch (err) {
    console.log({ err })
    return [ null, err ]
  }

  return [ data, null ]
  */
  return [ [], null ]
}

export const post = async () => {
  const rootUrl = false ? AUTH_URL : BASE_URL
  const url = `${rootUrl}/${endpoint}/.json`

  const res = await fetch(url, {
    method: 'POST'
    // ...stuff goes here
  })

}

const D = new Listing()
console.log({ D })

/*
const api = Devvit.use(Devvit.Types.RedditAPI.Listings)
console.log({ T: Devvit.Types })
*/

export const listing = async (subreddit = '') => {
  //const best = await api.Best()

  //const [ data, err ] = await get(subreddit)
  //return [ transform.listing(data || {}), err ]

  return [ [], null ]
}

export const comments = async (post = '') => {
  return []
}
