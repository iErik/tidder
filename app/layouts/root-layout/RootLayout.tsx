import { useState } from 'react'
import { Route, Routes } from 'react-router'

import FeedPage from 'pages/FeedPage/FeedPage'

import { useAuth } from 'core/auth'
import { useSetting } from 'core/useSetting'

import LoginScreen from './LoginScreen/LoginScreen'
import Sidebar from './Sidebar/Sidebar'
import Topbar from './Topbar/Topbar'

const platform = window.tidder.platform

// TODO:
// - Implement a loading state (improvement)
export default function RootLayout() {
  const { updating, loggedIn } = useAuth()
  const appTheme = useSetting<string>('appTheme')
  const [showSidebar, setShowSidebar] = useState(false)

  return (
    <div className={`root-container full-size container theme-${appTheme} ${platform}`}>
      <div className="full-size inner container">
        <Topbar
          onSidebarToggle={() => setShowSidebar(!showSidebar)}
        />

        { !updating && loggedIn &&
          <Sidebar isActive={showSidebar} />
        }

        <div className="page-outlet inner container">
          {!updating && loggedIn && (
            <Routes>
              <Route path="*" element={<FeedPage />} />
            </Routes>
          )}

          {!updating && !loggedIn && <LoginScreen />}
        </div>
      </div>
    </div>
  )
}
