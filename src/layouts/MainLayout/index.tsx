import { useState, useEffect } from 'react'
import { Outlet } from 'react-router'
import { Store } from '@tauri-apps/plugin-store'

import Titlebar from '@components/Titlebar'
import Sidebar from '@components/Sidebar'
import Feed from '@components/Feed'

import * as css from '@utils/css'
import './styles.scss'


function MainLayout () {
  const [theme, setTheme] = useState(null)
  const [showSidebar, setShowSidebar] = useState(false)

  useEffect(() => {
    const getTheme = async () => {
      const store = await Store.get('storage.json')
      const theme = await store.get('theme')

      setTheme(theme)
    }

    getTheme()
  }, [])

  useEffect(() => {
    css.bindThemeVars(theme)
  }, [ theme ])

  const onToggleSidebar = () => {
    setShowSidebar(!showSidebar)
  }

  return (
    <main className="MainLayout">
      <Titlebar onToggleSidebar={onToggleSidebar} />
      <section className="content">
        <Sidebar show={showSidebar} />
        <Outlet />
      </section>
    </main>
  )
}

export default MainLayout
