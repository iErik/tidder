import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import {
  BrowserRouter,
  Routes,
  Route
} from 'react-router'

import './index.scss'
import MainLayout from '@layouts/MainLayout/index.tsx'
import FeedPage from '@layouts/FeedPage'


createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/:subreddit?" element={<FeedPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
)
