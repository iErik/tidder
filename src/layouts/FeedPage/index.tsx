import { useState, useEffect } from 'react'
import { useLocation, useParams } from 'react-router'

import * as reddit from '@services/api'

import Feed from '@components/Feed'
//import Post from '@components/Post'

function FeedPage() {
  const location = useLocation()
  const params = useParams()

  const [posts, setPosts] = useState([])

  useEffect(() => {
    console.log({ params })

    const getPosts = async () => {
      const [ data, err ] = await reddit.listing('r/redditdev')
      console.log({ data })
      //setPosts(data)
    }

    getPosts()
  }, [ location ])


  return (
    <div className="FeedPage">
      <h1>HI</h1>
    </div>
  )
}

export default FeedPage
