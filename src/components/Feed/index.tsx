import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'

import Post from '@components/Post'

import reddit from '@services/api'

import './styles.scss'

function Feed() {
  const location = useLocation()
  const [posts, setPosts] = useState([])

  useEffect(() => {
    console.log({ location })

    const getPosts = async () => {
      const [ data, err ] = await reddit.listing()
      console.log({ data })
      setPosts(data)
    }

    getPosts()
  }, [ location ])

  const listing = posts.map(p => <Post data={p} />)

  return (
    <div className="Feed">
      { listing }
    </div>
  )
}

export default Feed
